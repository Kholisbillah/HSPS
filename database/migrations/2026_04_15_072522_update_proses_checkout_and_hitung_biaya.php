<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::unprepared('
            DROP FUNCTION IF EXISTS `hitung_biaya`;
            CREATE FUNCTION `hitung_biaya` (
                `p_waktu_masuk` DATETIME, 
                `p_waktu_keluar` DATETIME, 
                `p_tarif_per_jam` DECIMAL(10,0), 
                `p_tarif_jam_selanjutnya` DECIMAL(10,2)
            ) RETURNS DECIMAL(10,0) DETERMINISTIC 
            BEGIN
                DECLARE v_durasi_jam INT;
                DECLARE v_biaya DECIMAL(10,0);
                
                SET v_durasi_jam = CEIL(TIMESTAMPDIFF(MINUTE, p_waktu_masuk, p_waktu_keluar) / 60);
                IF v_durasi_jam <= 0 THEN
                    SET v_durasi_jam = 1;
                END IF;
                
                IF p_tarif_jam_selanjutnya <= 0 THEN
                    SET p_tarif_jam_selanjutnya = p_tarif_per_jam;
                END IF;
                
                IF v_durasi_jam <= 1 THEN
                    SET v_biaya = p_tarif_per_jam;
                ELSE
                    SET v_biaya = p_tarif_per_jam + (p_tarif_jam_selanjutnya * (v_durasi_jam - 1));
                END IF;

                RETURN v_biaya;
            END
        ');

        DB::unprepared('
            DROP PROCEDURE IF EXISTS `proses_checkout`;
            CREATE PROCEDURE `proses_checkout` (
                IN `p_id_parkir` BIGINT UNSIGNED, 
                IN `p_waktu_keluar` DATETIME, 
                IN `p_karcis_hilang` BOOLEAN
            )
            BEGIN
                DECLARE v_waktu_masuk DATETIME;
                DECLARE v_id_tarif BIGINT UNSIGNED;
                DECLARE v_jenis_kendaraan VARCHAR(20) CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
                DECLARE v_tarif_per_jam DECIMAL(10,0);
                DECLARE v_tarif_jam_selanjutnya DECIMAL(10,2);
                DECLARE v_durasi_jam INT;
                DECLARE v_biaya_total DECIMAL(10,0);
                DECLARE v_denda DECIMAL(10,0) DEFAULT 0;
                
                -- 1. Ambil data transaksi awal
                SELECT waktu_masuk, id_tarif, jenis_kendaraan 
                INTO v_waktu_masuk, v_id_tarif, v_jenis_kendaraan
                FROM transaksi WHERE id_parkir = p_id_parkir;
                
                -- 2. Ambil tarif normal
                SELECT tarif_per_jam, tarif_jam_selanjutnya 
                INTO v_tarif_per_jam, v_tarif_jam_selanjutnya
                FROM tarif WHERE id_tarif = v_id_tarif;
                
                -- 3. Hitung durasi jam
                SET v_durasi_jam = CEIL(TIMESTAMPDIFF(MINUTE, v_waktu_masuk, p_waktu_keluar) / 60);
                IF v_durasi_jam <= 0 THEN
                    SET v_durasi_jam = 1;
                END IF;
                
                -- 4. Panggil hitung_biaya
                SET v_biaya_total = hitung_biaya(v_waktu_masuk, p_waktu_keluar, v_tarif_per_jam, v_tarif_jam_selanjutnya);
                
                -- 5. Jika karcis hilang, tambahkan denda
                IF p_karcis_hilang = TRUE THEN
                    SELECT tarif_per_jam INTO v_denda
                    FROM tarif
                    WHERE jenis_kendaraan = v_jenis_kendaraan COLLATE utf8mb4_unicode_ci 
                          AND tipe_tarif = \'denda\' COLLATE utf8mb4_unicode_ci
                    LIMIT 1;

                    IF v_denda IS NULL THEN
                        SET v_denda = 0;
                    END IF;

                    SET v_biaya_total = v_biaya_total + v_denda;
                END IF;
                
                -- 6. Update transaksi
                UPDATE transaksi 
                SET waktu_keluar = p_waktu_keluar,
                    durasi_jam = v_durasi_jam,
                    biaya_total = v_biaya_total,
                    karcis_hilang = p_karcis_hilang,
                    status = \'keluar\'
                WHERE id_parkir = p_id_parkir;
            END
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP PROCEDURE IF EXISTS `proses_checkout`');
        DB::unprepared('DROP FUNCTION IF EXISTS `hitung_biaya`');
    }
};

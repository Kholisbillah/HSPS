-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306:8111
-- Generation Time: Apr 15, 2026 at 03:17 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hermina_parking`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`` PROCEDURE `proses_checkout` (IN `p_id_parkir` BIGINT UNSIGNED, IN `p_waktu_keluar` DATETIME, IN `p_karcis_hilang` BOOLEAN)   BEGIN
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
                          AND tipe_tarif = 'denda' COLLATE utf8mb4_unicode_ci
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
                    status = 'keluar'
                WHERE id_parkir = p_id_parkir;
            END$$

--
-- Functions
--
CREATE DEFINER=`` FUNCTION `hitung_biaya` (`p_waktu_masuk` DATETIME, `p_waktu_keluar` DATETIME, `p_tarif_per_jam` DECIMAL(10,0), `p_tarif_jam_selanjutnya` DECIMAL(10,2)) RETURNS DECIMAL(10,0) DETERMINISTIC BEGIN
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
            END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `area_parkir`
--

CREATE TABLE `area_parkir` (
  `id_area` bigint(20) UNSIGNED NOT NULL,
  `nama_area` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kapasitas` int(11) NOT NULL,
  `peruntukan` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'semua',
  `terisi` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `area_parkir`
--

INSERT INTO `area_parkir` (`id_area`, `nama_area`, `kapasitas`, `peruntukan`, `terisi`, `created_at`, `updated_at`) VALUES
(1, 'Basement 1 - Motor Umum', 200, 'motor', 0, '2026-03-18 14:19:10', '2026-04-15 00:35:20'),
(2, 'Pelataran Depan - Mobil Umum', 50, 'mobil', 0, '2026-03-18 14:19:10', '2026-03-28 07:41:49'),
(4, 'IGD / Emergency Drop', 5, 'lainnya', 0, '2026-03-18 14:19:10', '2026-03-18 14:19:10');

-- --------------------------------------------------------

--
-- Table structure for table `gates`
--

CREATE TABLE `gates` (
  `id_gate` bigint(20) UNSIGNED NOT NULL,
  `kode_gate` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama_gate` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','semua','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('masuk','keluar') COLLATE utf8mb4_unicode_ci NOT NULL,
  `metode_pembayaran` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gates`
--

INSERT INTO `gates` (`id_gate`, `kode_gate`, `nama_gate`, `jenis_kendaraan`, `direction`, `metode_pembayaran`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'gate_in_motor', 'Gate Masuk A — Roda 2 (Motor)', 'motor', 'masuk', NULL, 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(2, 'gate_in_mobil', 'Gate Masuk B — Roda 4 (Mobil)', 'mobil', 'masuk', NULL, 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(3, 'gate_out_1', 'Gate Keluar 1 — Roda 2, Cash', 'motor', 'keluar', 'cash', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(4, 'gate_out_2', 'Gate Keluar 2 — Roda 4, Cash', 'mobil', 'keluar', 'cash', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(5, 'gate_out_3', 'Gate Keluar 3 — Roda 2, Cashless', 'motor', 'keluar', 'cashless', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(6, 'gate_out_4', 'Gate Keluar 4 — Roda 4, Cashless', 'mobil', 'keluar', 'cashless', 1, '2026-03-29 06:00:38', '2026-03-29 06:24:53'),
(7, 'gate_in_igd', 'Gate Masuk C — IGD / Emergency', 'lainnya', 'masuk', NULL, 1, '2026-04-15 01:03:47', '2026-04-15 01:03:47'),
(8, 'gate_out_5', 'Gate Keluar 5 — IGD / Emergency', 'lainnya', 'keluar', 'cash', 1, '2026-04-15 01:03:47', '2026-04-15 01:03:47');

-- --------------------------------------------------------

--
-- Table structure for table `kendaraan`
--

CREATE TABLE `kendaraan` (
  `id_kendaraan` bigint(20) UNSIGNED NOT NULL,
  `plat_nomor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `warna` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pemilik` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `id_user` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kendaraan`
--

INSERT INTO `kendaraan` (`id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `warna`, `pemilik`, `created_at`, `updated_at`, `id_user`) VALUES
(1, 'B2175TOR', 'mobil', 'Putih', 'Dr. Tauhidan Aminn', '2026-03-18 14:20:20', '2026-03-18 14:20:20', 1);

-- --------------------------------------------------------

--
-- Table structure for table `log_aktivitas`
--

CREATE TABLE `log_aktivitas` (
  `id_log` bigint(20) UNSIGNED NOT NULL,
  `id_user` bigint(20) UNSIGNED NOT NULL,
  `aktivitas` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `waktu_aktivitas` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `log_aktivitas`
--

INSERT INTO `log_aktivitas` (`id_log`, `id_user`, `aktivitas`, `waktu_aktivitas`) VALUES
(1, 1, 'User melakukan Login', '2026-03-18 21:20:04'),
(2, 1, 'Admin mendaftarkan Member baru: B2175TOR', '2026-03-18 21:20:20'),
(3, 1, 'User melakukan Login', '2026-03-28 14:10:49'),
(4, 1, 'Petugas memproses Kendaraan Masuk: B1223H (via Manual)', '2026-03-28 14:11:38'),
(5, 1, 'Petugas memproses Checkout: B1223H (Rp 2,000)', '2026-03-28 14:11:55'),
(6, 1, 'Petugas memproses Kendaraan Masuk: B2175TOR (via QR)', '2026-03-28 14:37:08'),
(7, 1, 'Petugas memproses Checkout: B2175TOR (Member - Gratis)', '2026-03-28 14:41:49'),
(8, 1, 'Petugas memproses Kendaraan Masuk: B2175TOR (via QR)', '2026-03-28 14:42:26'),
(9, 1, 'User melakukan Login', '2026-03-28 18:01:54'),
(13, 1, 'User melakukan Login', '2026-03-29 13:12:26'),
(14, 1, 'User melakukan Logout', '2026-03-29 13:13:38'),
(15, 2, 'User melakukan Login', '2026-03-29 13:13:46'),
(16, 2, 'User melakukan Logout', '2026-03-29 13:14:10'),
(17, 3, 'User melakukan Login', '2026-03-29 13:14:21'),
(18, 3, 'User melakukan Logout', '2026-03-29 13:17:33'),
(21, 1, 'User melakukan Login', '2026-03-29 13:19:20'),
(22, 1, 'DARURAT: Semua gate diaktifkan oleh Admin.', '2026-03-29 13:24:53'),
(23, 1, 'User melakukan Login', '2026-03-29 13:26:24'),
(24, 1, 'User melakukan Logout', '2026-03-29 13:34:28'),
(25, 2, 'User melakukan Login', '2026-03-29 13:34:36'),
(26, 2, 'User melakukan Logout', '2026-03-29 13:34:43'),
(29, 2, 'User melakukan Login', '2026-03-29 13:54:27'),
(30, 2, 'User melakukan Login', '2026-03-31 06:45:30'),
(31, 2, 'User melakukan Logout', '2026-03-31 06:54:35'),
(32, 2, 'User melakukan Login', '2026-03-31 06:56:09'),
(33, 2, 'Kendaraan Masuk: B2175TOR via Gate MOTOR (QR) [VIP]', '2026-03-31 07:01:32'),
(34, 2, 'Kendaraan Masuk: B2175TOR via Gate MOTOR (QR) [VIP]', '2026-03-31 07:02:00'),
(35, 2, 'User melakukan Logout', '2026-03-31 07:10:53'),
(36, 2, 'User melakukan Login', '2026-03-31 07:11:04'),
(37, 2, 'Kendaraan Masuk: GATE-M-31071254 via Gate MOTOR (Manual)', '2026-03-31 07:12:54'),
(38, 2, 'Checkout: B2175TOR via gate_out_1 [VIP - Gratis]', '2026-03-31 07:14:20'),
(39, 2, 'User melakukan Logout', '2026-03-31 07:51:38'),
(40, 2, 'User melakukan Login', '2026-03-31 08:16:15'),
(41, 2, 'User melakukan Logout', '2026-03-31 08:19:00'),
(42, 2, 'User melakukan Login', '2026-03-31 08:34:57'),
(43, 2, 'User melakukan Logout', '2026-03-31 08:53:47'),
(44, 2, 'User melakukan Login', '2026-03-31 08:55:29'),
(45, 2, 'User melakukan Logout', '2026-03-31 09:02:16'),
(46, 1, 'User melakukan Login', '2026-03-31 09:02:40'),
(47, 1, 'User melakukan Logout', '2026-03-31 09:05:09'),
(48, 3, 'User melakukan Login', '2026-03-31 09:05:21'),
(49, 3, 'User melakukan Logout', '2026-03-31 09:06:27'),
(50, 2, 'User melakukan Login', '2026-03-31 09:14:22'),
(51, 2, 'User melakukan Login', '2026-03-31 13:20:59'),
(52, 2, 'User melakukan Login', '2026-03-31 17:18:36'),
(53, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 17:19:02'),
(54, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 17:19:22'),
(55, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 17:25:09'),
(56, 2, 'User melakukan Login', '2026-03-31 19:53:36'),
(57, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 19:54:01'),
(58, 2, 'Checkout: B2175TOR via gate_out_1 [VIP - Gratis]', '2026-03-31 19:55:12'),
(59, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 20:17:36'),
(60, 2, 'Checkout: - via gate_out_1 (cash) Rp 2,000', '2026-03-31 20:18:22'),
(61, 2, 'Checkout: GATE-M-31071254 via gate_out_1 (cash) Rp 28,000', '2026-03-31 20:31:45'),
(62, 2, 'Checkout: - via gate_out_1 (cash) Rp 8,000', '2026-03-31 20:31:53'),
(63, 2, 'Checkout: - via gate_out_1 (cash) Rp 8,000', '2026-03-31 20:38:04'),
(64, 2, 'Checkout: - via gate_out_1 (cash) Rp 8,000', '2026-03-31 20:38:09'),
(65, 2, 'Checkout: - via gate_out_1 (cash) Rp 2,000', '2026-03-31 20:38:15'),
(66, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 20:50:10'),
(67, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-03-31 20:54:24'),
(68, 1, 'User melakukan Login', '2026-04-01 07:37:37'),
(69, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-04-01 07:38:06'),
(70, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-01 07:55:11'),
(71, 2, 'User melakukan Login', '2026-04-02 07:14:15'),
(72, 2, 'Checkout: - via gate_out_1 (cash) Rp 70,000', '2026-04-02 07:14:40'),
(73, 2, 'Checkout: - via gate_out_1 (cash) Rp 70,000', '2026-04-02 07:14:51'),
(74, 2, 'Checkout: - via gate_out_1 (cash) Rp 48,000', '2026-04-02 07:15:00'),
(75, 2, 'Checkout: - via gate_out_1 (cash) Rp 48,000', '2026-04-02 07:15:11'),
(76, 1, 'User melakukan Login', '2026-04-02 08:38:23'),
(77, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-02 08:39:10'),
(78, 2, 'User melakukan Login', '2026-04-02 10:13:07'),
(79, 2, 'User melakukan Login', '2026-04-02 10:13:44'),
(80, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 4,000]', '2026-04-02 10:14:02'),
(81, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-02 10:20:24'),
(82, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 2,000]', '2026-04-02 10:21:12'),
(83, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-02 10:40:24'),
(84, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 2,000]', '2026-04-02 10:41:21'),
(85, 1, 'User melakukan Login', '2026-04-02 10:47:33'),
(86, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-02 10:48:00'),
(87, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 2,000]', '2026-04-02 10:53:44'),
(88, 1, 'User melakukan Login', '2026-04-03 13:59:07'),
(89, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-03 13:59:54'),
(90, 1, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 22,000] [KARCIS HILANG]', '2026-04-03 14:00:32'),
(91, 1, 'Admin memperbarui Denda Tiket Hilang motor: Rp 20,000 → Rp 10,000', '2026-04-03 14:13:44'),
(92, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-03 14:14:05'),
(93, 1, 'Checkout: - via gate_out_1 [KARCIS HILANG - Denda] (Rp 12,000)', '2026-04-03 14:14:52'),
(94, 1, 'User melakukan Logout', '2026-04-03 14:15:52'),
(95, 2, 'User melakukan Login', '2026-04-03 14:26:07'),
(96, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-03 14:26:59'),
(97, 2, 'Checkout: - via gate_out_1 (cash) Rp 2,000', '2026-04-03 14:27:48'),
(98, 2, 'User melakukan Login', '2026-04-06 10:37:54'),
(99, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-06 10:38:15'),
(100, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 2,000]', '2026-04-06 10:39:50'),
(101, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-06 10:47:21'),
(102, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 2,000]', '2026-04-06 10:56:21'),
(103, 1, 'User melakukan Login', '2026-04-08 09:42:13'),
(104, 1, 'User melakukan Logout', '2026-04-08 09:50:39'),
(105, 1, 'User melakukan Login', '2026-04-08 10:37:29'),
(106, 1, 'User melakukan Logout', '2026-04-08 11:07:29'),
(107, 1, 'User melakukan Login', '2026-04-08 11:07:58'),
(108, 1, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-04-08 11:09:25'),
(109, 1, 'User melakukan Logout', '2026-04-08 11:16:57'),
(110, 1, 'User melakukan Login', '2026-04-08 11:17:28'),
(111, 1, 'User melakukan Logout', '2026-04-08 11:19:15'),
(112, 2, 'User melakukan Login', '2026-04-08 11:19:34'),
(113, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera)', '2026-04-08 11:20:21'),
(114, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 2,000] [KARCIS HILANG]', '2026-04-08 11:22:52'),
(115, 2, 'Checkout: - via gate_out_1 (cash) Rp 2,000', '2026-04-08 11:23:49'),
(116, 2, 'User melakukan Logout', '2026-04-08 11:24:17'),
(117, 2, 'User melakukan Login', '2026-04-08 11:25:06'),
(118, 2, 'User melakukan Logout', '2026-04-08 11:37:27'),
(119, 2, 'User melakukan Login', '2026-04-08 11:54:35'),
(120, 2, 'User melakukan Logout', '2026-04-08 11:54:46'),
(121, 6, 'User melakukan Login', '2026-04-14 11:36:39'),
(122, 6, 'User melakukan Login', '2026-04-14 13:22:50'),
(123, 6, 'Admin menambahkan Denda Tiket Hilang: motor sebesar Rp 30,000', '2026-04-14 13:29:13'),
(124, 6, 'Admin menambahkan Denda Tiket Hilang: mobil sebesar Rp 50,000', '2026-04-14 13:29:28'),
(125, 6, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-14 13:45:42'),
(126, 2, 'User melakukan Login', '2026-04-15 07:34:52'),
(127, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-15 07:35:20'),
(128, 6, 'User melakukan Login', '2026-04-15 07:36:32'),
(129, 2, 'Checkout: - via gate_out_1 [KARCIS HILANG - Denda] (Rp 66,000)', '2026-04-15 07:37:01'),
(130, 2, 'Checkout: - via gate_out_1 [KARCIS HILANG - Denda] (Rp 32,000)', '2026-04-15 07:37:47'),
(131, 6, 'Admin MENGHAPUS Area Parkir: Area VIP / Dokter', '2026-04-15 07:42:05'),
(132, 2, 'User melakukan Login', '2026-04-15 08:13:30'),
(133, 2, 'Kendaraan Masuk: - via Gate MOTOR (Kamera) [FOTO]', '2026-04-15 08:14:11'),
(134, 2, 'Checkout: - via gate_out_3 [Cashless QRIS - Rp 32,000] [KARCIS HILANG]', '2026-04-15 08:15:15');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(2, '2024_01_01_000001_create_users_table', 1),
(3, '2024_01_01_000002_create_area_parkir_table', 1),
(4, '2024_01_01_000003_create_tarif_table', 1),
(5, '2024_01_01_000004_create_kendaraan_table', 1),
(6, '2024_01_01_000005_create_transaksi_table', 1),
(7, '2024_01_01_000006_create_log_aktivitas_table', 1),
(8, '2026_02_04_000001_remove_id_user_from_kendaraan', 1),
(9, '2026_02_04_000003_add_id_user_to_kendaraan', 1),
(10, '2026_02_04_131821_align_kendaraan_structure_to_prd', 1),
(11, '2026_02_04_134209_remove_id_user_from_kendaraan_table', 1),
(12, '2026_02_04_135550_add_id_user_to_kendaraan_table', 1),
(13, '2026_02_19_000001_add_jenis_kendaraan_to_transaksi_table', 1),
(14, '2026_02_21_000001_rename_id_transaksi_to_id_parkir_and_add_id_kendaraan', 1),
(15, '2026_02_21_000002_add_performance_indexes', 1),
(16, '2026_02_23_000001_add_peruntukan_to_area_parkir', 1),
(17, '2026_02_23_000001_change_tarif_decimal_precision', 1),
(18, '2026_02_24_164242_change_status_aktif_type_on_users_table', 1),
(19, '2026_03_28_140123_add_metode_entry_to_transaksi_table', 2),
(20, '2026_03_29_000001_add_gate_fields_to_transaksi_table', 3),
(21, '2026_03_29_000002_add_tipe_tarif_to_tarif_table', 3),
(22, '2026_03_29_000003_create_gates_table', 3),
(23, '2026_03_31_000001_add_foto_columns_and_update_metode_entry', 4),
(24, '2026_03_31_000001_add_tarif_jam_selanjutnya_to_tarif_table', 5),
(25, '2026_04_02_000001_add_doku_reference_no_to_transaksi_table', 6),
(26, '2026_04_02_000002_add_karcis_hilang_to_transaksi_table', 7),
(27, '2026_04_03_000001_set_transaksi_auto_increment_prefix', 8),
(29, '2026_04_15_072522_update_proses_checkout_and_hitung_biaya', 9),
(30, '2026_04_15_080000_fix_area_occupancy_and_add_igd_gate', 10);

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tarif`
--

CREATE TABLE `tarif` (
  `id_tarif` bigint(20) UNSIGNED NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tarif_per_jam` decimal(10,0) NOT NULL,
  `tarif_jam_selanjutnya` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tipe_tarif` enum('normal','denda') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tarif`
--

INSERT INTO `tarif` (`id_tarif`, `jenis_kendaraan`, `tarif_per_jam`, `tarif_jam_selanjutnya`, `tipe_tarif`, `created_at`, `updated_at`) VALUES
(1, 'motor', 2000, 0.00, 'normal', '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(2, 'mobil', 5000, 0.00, 'normal', '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(3, 'lainnya', 0, 0.00, 'normal', '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(6, 'motor', 30000, 0.00, 'denda', '2026-04-14 06:29:13', '2026-04-14 06:29:13'),
(7, 'mobil', 50000, 0.00, 'denda', '2026-04-14 06:29:28', '2026-04-14 06:29:28');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `id_parkir` bigint(20) UNSIGNED NOT NULL,
  `id_tarif` bigint(20) UNSIGNED NOT NULL,
  `id_area` bigint(20) UNSIGNED NOT NULL,
  `id_user` bigint(20) UNSIGNED NOT NULL,
  `id_kendaraan` bigint(20) UNSIGNED DEFAULT NULL,
  `plat_nomor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jenis_kendaraan` enum('motor','mobil','lainnya') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `waktu_masuk` datetime NOT NULL,
  `waktu_keluar` datetime DEFAULT NULL,
  `durasi_jam` int(11) DEFAULT NULL,
  `biaya_total` decimal(10,0) DEFAULT NULL,
  `status` enum('masuk','keluar') COLLATE utf8mb4_unicode_ci NOT NULL,
  `metode_entry` enum('Kamera','QR','Manual') COLLATE utf8mb4_unicode_ci DEFAULT 'Manual',
  `gate_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metode_pembayaran` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `karcis_hilang` tinyint(1) NOT NULL DEFAULT 0,
  `doku_reference_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_masuk` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_keluar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`id_parkir`, `id_tarif`, `id_area`, `id_user`, `id_kendaraan`, `plat_nomor`, `jenis_kendaraan`, `waktu_masuk`, `waktu_keluar`, `durasi_jam`, `biaya_total`, `status`, `metode_entry`, `gate_type`, `metode_pembayaran`, `karcis_hilang`, `doku_reference_no`, `foto_masuk`, `foto_keluar`, `created_at`, `updated_at`) VALUES
(8010001, 1, 1, 2, NULL, '-', 'motor', '2026-04-03 14:26:59', '2026-04-03 14:27:48', 1, 2000, 'keluar', 'Kamera', 'gate_out_1', 'cash', 0, NULL, 'https://res.cloudinary.com/dzl0dstef/image/upload/v1775201217/hermina_parking/masuk/oxslikm3jxlfam86np0f.jpg', NULL, '2026-04-03 07:26:59', '2026-04-03 07:27:48'),
(8010002, 1, 1, 2, NULL, '-', 'motor', '2026-04-06 10:38:15', '2026-04-06 10:39:50', 1, 2000, 'keluar', 'Kamera', 'gate_out_3', 'cashless', 0, 'PKR-8010002-20260406103938', 'https://res.cloudinary.com/dzl0dstef/image/upload/v1775446693/hermina_parking/masuk/xmho5ttlelbamfcnqgit.jpg', NULL, '2026-04-06 03:38:15', '2026-04-06 03:39:50'),
(8010003, 1, 1, 2, NULL, '-', 'motor', '2026-04-06 10:47:21', '2026-04-06 10:56:21', 1, 2000, 'keluar', 'Kamera', 'gate_out_3', 'cashless', 0, 'PKR-8010003-20260406105611', 'https://res.cloudinary.com/dzl0dstef/image/upload/v1775447239/hermina_parking/masuk/qxcquaqmbhjennxdk3uc.jpg', NULL, '2026-04-06 03:47:21', '2026-04-06 03:56:21'),
(8010004, 1, 1, 1, NULL, '-', 'motor', '2026-04-08 11:09:25', '2026-04-08 11:22:52', 1, 2000, 'keluar', 'Kamera', 'gate_out_3', 'cashless', 1, 'PKR-8010004-20260408112236', NULL, NULL, '2026-04-08 04:09:25', '2026-04-08 04:22:52'),
(8010005, 1, 1, 2, NULL, '-', 'motor', '2026-04-08 11:20:21', '2026-04-08 11:23:48', 1, 2000, 'keluar', 'Kamera', 'gate_out_1', 'cash', 0, NULL, NULL, NULL, '2026-04-08 04:20:21', '2026-04-08 04:23:48'),
(8010006, 1, 1, 6, NULL, '-', 'motor', '2026-04-14 13:45:42', '2026-04-15 07:37:01', 18, 66000, 'keluar', 'Kamera', 'gate_out_1', 'cash', 1, NULL, 'https://res.cloudinary.com/dzl0dstef/image/upload/v1776149140/hermina_parking/masuk/wbhq0hewpvllcdqlsoug.jpg', NULL, '2026-04-14 06:45:42', '2026-04-15 00:37:01'),
(8010007, 1, 1, 2, NULL, '-', 'motor', '2026-04-15 07:35:20', '2026-04-15 07:37:47', 1, 32000, 'keluar', 'Kamera', 'gate_out_1', 'cash', 1, NULL, 'https://res.cloudinary.com/dzl0dstef/image/upload/v1776213311/hermina_parking/masuk/o4cvzx54zvfrmh7tr0wd.jpg', NULL, '2026-04-15 00:35:20', '2026-04-15 00:37:47'),
(8010008, 1, 1, 2, NULL, '-', 'motor', '2026-04-15 08:14:11', '2026-04-15 08:15:15', 1, 32000, 'keluar', 'Kamera', 'gate_out_3', 'cashless', 1, 'PKR-8010008-20260415081504', 'https://res.cloudinary.com/dzl0dstef/image/upload/v1776215645/hermina_parking/masuk/kbqnptb9qmibkhqtojzw.jpg', NULL, '2026-04-15 01:14:11', '2026-04-15 01:15:15');

--
-- Triggers `transaksi`
--
DELIMITER $$
CREATE TRIGGER `tr_transaksi_keluar` AFTER UPDATE ON `transaksi` FOR EACH ROW BEGIN
    IF NEW.status = 'keluar' AND OLD.status = 'masuk' THEN
        UPDATE area_parkir 
        SET terisi = terisi - 1 
        WHERE id_area = NEW.id_area;
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `tr_transaksi_masuk` AFTER INSERT ON `transaksi` FOR EACH ROW BEGIN
    IF NEW.status = 'masuk' THEN
        UPDATE area_parkir 
        SET terisi = terisi + 1 
        WHERE id_area = NEW.id_area;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` bigint(20) UNSIGNED NOT NULL,
  `nama_lengkap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_root','admin','petugas','owner') COLLATE utf8mb4_unicode_ci DEFAULT 'petugas',
  `status_aktif` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `nama_lengkap`, `username`, `password`, `role`, `status_aktif`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin System', 'admin', '$2y$10$qr8k1yPYqWPzwint2oYw2O2vy/2O8Uo8KBjLGuCC6/pnRRvmZKlzq', 'admin', 'aktif', NULL, '2026-03-18 14:19:09', '2026-03-18 14:19:09'),
(2, 'Petugas Gate 1', 'petugas', '$2y$10$o8eDcDMxnMkwK0fe/cB3n.HANKI8cNHNrRs87yaiZnLLlvZAiY/yC', 'petugas', 'aktif', NULL, '2026-03-18 14:19:09', '2026-03-18 14:19:09'),
(3, 'Owner Hermina', 'owner', '$2y$10$LSa8/TKLNS.I9rsdh1sjgOyzmQ97Y4Wn3fJ7oInY6AnMyD1zP2DlG', 'owner', 'aktif', NULL, '2026-03-18 14:19:10', '2026-03-18 14:19:10'),
(6, 'Super Root Hermina', 'super_root', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_root', 'aktif', NULL, '2026-04-14 04:33:44', '2026-04-14 04:33:44');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_laporan_harian`
-- (See below for the actual view)
--
CREATE TABLE `v_laporan_harian` (
`tanggal` date
,`jenis_kendaraan` enum('motor','mobil','lainnya')
,`total_kendaraan_keluar` bigint(21)
,`akumulasi_waktu_jam` decimal(32,0)
,`pendapatan_total` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Structure for view `v_laporan_harian`
--
DROP TABLE IF EXISTS `v_laporan_harian`;

CREATE ALGORITHM=UNDEFINED DEFINER=`` SQL SECURITY DEFINER VIEW `v_laporan_harian`  AS SELECT cast(`transaksi`.`waktu_keluar` as date) AS `tanggal`, `transaksi`.`jenis_kendaraan` AS `jenis_kendaraan`, count(`transaksi`.`id_parkir`) AS `total_kendaraan_keluar`, sum(`transaksi`.`durasi_jam`) AS `akumulasi_waktu_jam`, sum(`transaksi`.`biaya_total`) AS `pendapatan_total` FROM `transaksi` WHERE `transaksi`.`status` = 'keluar' GROUP BY cast(`transaksi`.`waktu_keluar` as date), `transaksi`.`jenis_kendaraan` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `area_parkir`
--
ALTER TABLE `area_parkir`
  ADD PRIMARY KEY (`id_area`);

--
-- Indexes for table `gates`
--
ALTER TABLE `gates`
  ADD PRIMARY KEY (`id_gate`),
  ADD UNIQUE KEY `gates_kode_gate_unique` (`kode_gate`);

--
-- Indexes for table `kendaraan`
--
ALTER TABLE `kendaraan`
  ADD PRIMARY KEY (`id_kendaraan`),
  ADD UNIQUE KEY `kendaraan_plat_nomor_unique` (`plat_nomor`),
  ADD KEY `kendaraan_id_user_foreign` (`id_user`);

--
-- Indexes for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `log_aktivitas_id_user_foreign` (`id_user`),
  ADD KEY `log_aktivitas_waktu_aktivitas_index` (`waktu_aktivitas`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `tarif`
--
ALTER TABLE `tarif`
  ADD PRIMARY KEY (`id_tarif`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`id_parkir`),
  ADD KEY `transaksi_id_tarif_foreign` (`id_tarif`),
  ADD KEY `transaksi_id_area_foreign` (`id_area`),
  ADD KEY `transaksi_id_user_foreign` (`id_user`),
  ADD KEY `transaksi_id_kendaraan_foreign` (`id_kendaraan`),
  ADD KEY `transaksi_plat_nomor_index` (`plat_nomor`),
  ADD KEY `transaksi_status_index` (`status`),
  ADD KEY `transaksi_waktu_masuk_index` (`waktu_masuk`),
  ADD KEY `transaksi_waktu_keluar_index` (`waktu_keluar`),
  ADD KEY `idx_doku_reference_no` (`doku_reference_no`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `area_parkir`
--
ALTER TABLE `area_parkir`
  MODIFY `id_area` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `gates`
--
ALTER TABLE `gates`
  MODIFY `id_gate` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `kendaraan`
--
ALTER TABLE `kendaraan`
  MODIFY `id_kendaraan` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  MODIFY `id_log` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=135;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tarif`
--
ALTER TABLE `tarif`
  MODIFY `id_tarif` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `id_parkir` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8010009;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `kendaraan`
--
ALTER TABLE `kendaraan`
  ADD CONSTRAINT `kendaraan_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD CONSTRAINT `log_aktivitas_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_id_area_foreign` FOREIGN KEY (`id_area`) REFERENCES `area_parkir` (`id_area`),
  ADD CONSTRAINT `transaksi_id_kendaraan_foreign` FOREIGN KEY (`id_kendaraan`) REFERENCES `kendaraan` (`id_kendaraan`) ON DELETE SET NULL,
  ADD CONSTRAINT `transaksi_id_tarif_foreign` FOREIGN KEY (`id_tarif`) REFERENCES `tarif` (`id_tarif`),
  ADD CONSTRAINT `transaksi_id_user_foreign` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tarif;
use App\Models\AreaParkir;
use App\Models\Kendaraan;
use App\Models\Transaksi;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Test untuk alur transaksi parkir (GateIn & GateOut).
 * Mencakup: masuk kendaraan, area increment, scan checkout, kalkulasi biaya, dan area decrement.
 */
class TransaksiTest extends TestCase
{
    use RefreshDatabase;

    protected User $petugas;
    protected Tarif $tarifMotor;
    protected Tarif $tarifMobil;
    protected AreaParkir $area;

    /**
     * Setup data dasar yang diperlukan semua test.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Buat user petugas untuk autentikasi
        $this->petugas = User::create([
            'nama_lengkap' => 'Test Petugas',
            'username' => 'petugas_test',
            'password' => 'password',
            'role' => 'petugas',
            'status_aktif' => 'aktif',
        ]);

        // Buat tarif parkir
        $this->tarifMotor = Tarif::create([
            'jenis_kendaraan' => 'motor',
            'tarif_per_jam' => 2000,
        ]);

        $this->tarifMobil = Tarif::create([
            'jenis_kendaraan' => 'mobil',
            'tarif_per_jam' => 5000,
        ]);

        // Buat area parkir dengan kapasitas
        $this->area = AreaParkir::create([
            'nama_area' => 'Test Area Motor',
            'kapasitas' => 10,
            'terisi' => 0,
            'peruntukan' => 'motor',
        ]);
    }

    /**
     * Test: Gate In berhasil membuat transaksi baru.
     */
    public function test_gate_in_creates_new_transaction(): void
    {
        $response = $this->actingAs($this->petugas)->post(route('gate.in.store'), [
            'plat_nomor' => 'B1234XYZ',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'metode_entry' => 'Manual',
        ]);

        $response->assertRedirect();

        // Pastikan transaksi terbuat
        $this->assertDatabaseHas('transaksi', [
            'plat_nomor' => 'B1234XYZ',
            'jenis_kendaraan' => 'motor',
            'status' => 'masuk',
        ]);
    }

    /**
     * Test: Gate In menambah counter area (terisi + 1).
     */
    public function test_gate_in_increments_area_occupancy(): void
    {
        $this->actingAs($this->petugas)->post(route('gate.in.store'), [
            'plat_nomor' => 'B5678ABC',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'metode_entry' => 'OCR',
        ]);

        // Area terisi harus naik 1
        $this->area->refresh();
        $this->assertEquals(1, $this->area->terisi);
    }

    /**
     * Test: Gate In ditolak saat area penuh.
     */
    public function test_gate_in_rejected_when_area_full(): void
    {
        // Set area penuh
        $this->area->update(['terisi' => $this->area->kapasitas]);

        $response = $this->actingAs($this->petugas)->post(route('gate.in.store'), [
            'plat_nomor' => 'B9999ZZZ',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'metode_entry' => 'Manual',
        ]);

        // Pastikan transaksi TIDAK terbuat
        $this->assertDatabaseMissing('transaksi', [
            'plat_nomor' => 'B9999ZZZ',
        ]);
    }

    /**
     * Test: Gate Out scan menemukan kendaraan yang sedang parkir.
     */
    public function test_gate_out_scan_finds_parked_vehicle(): void
    {
        // Buat transaksi aktif
        $transaksi = Transaksi::create([
            'plat_nomor' => 'B1234XYZ',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'id_tarif' => $this->tarifMotor->id_tarif,
            'id_user' => $this->petugas->id_user,
            'waktu_masuk' => now()->subHours(2),
            'status' => 'masuk',
        ]);

        $response = $this->actingAs($this->petugas)->post(route('gate.out.scan'), [
            'plat_nomor' => 'B1234XYZ',
        ]);

        $response->assertJsonStructure([
            'status',
            'data' => [
                'transaksi',
                'biaya_total',
                'durasi_text',
                'is_member',
            ],
        ]);
    }

    /**
     * Test: Gate Out checkout mengurangi counter area dan update status.
     */
    public function test_gate_out_checkout_decrements_area(): void
    {
        $this->area->update(['terisi' => 1]);

        $transaksi = Transaksi::create([
            'plat_nomor' => 'B7777KKK',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'id_tarif' => $this->tarifMotor->id_tarif,
            'id_user' => $this->petugas->id_user,
            'waktu_masuk' => now()->subHours(1),
            'status' => 'masuk',
        ]);

        $response = $this->actingAs($this->petugas)->post(route('gate.out.store'), [
            'id_parkir' => $transaksi->id_parkir,
            'uang_dibayar' => 5000,
        ]);

        $response->assertOk();

        // Cek area terisi berkurang
        $this->area->refresh();
        $this->assertEquals(0, $this->area->terisi);

        // Cek transaksi status berubah
        $transaksi->refresh();
        $this->assertEquals('keluar', $transaksi->status);
        $this->assertNotNull($transaksi->waktu_keluar);
    }

    /**
     * Test: Member mendapat parkir gratis.
     */
    public function test_member_gets_free_parking(): void
    {
        // Daftarkan kendaraan sebagai member
        Kendaraan::create([
            'plat_nomor' => 'B1111VIP',
            'pemilik' => 'Dr. Member',
            'jenis_kendaraan' => 'motor',
            'warna' => 'Hitam',
            'id_user' => $this->petugas->id_user,
        ]);

        // Buat transaksi aktif
        $transaksi = Transaksi::create([
            'plat_nomor' => 'B1111VIP',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'id_tarif' => $this->tarifMotor->id_tarif,
            'id_user' => $this->petugas->id_user,
            'waktu_masuk' => now()->subHours(5),
            'status' => 'masuk',
        ]);
        $this->area->update(['terisi' => 1]);

        // Scan — biaya harus 0 untuk member
        $scanResponse = $this->actingAs($this->petugas)->post(route('gate.out.scan'), [
            'plat_nomor' => 'B1111VIP',
        ]);

        $scanResponse->assertJson([
            'data' => [
                'is_member' => true,
                'biaya_total' => 0,
            ],
        ]);
    }

    /**
     * Test: Double checkout ditolak (mencegah manipulasi).
     */
    public function test_double_checkout_is_prevented(): void
    {
        $transaksi = Transaksi::create([
            'plat_nomor' => 'B2222DDD',
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'id_tarif' => $this->tarifMotor->id_tarif,
            'id_user' => $this->petugas->id_user,
            'waktu_masuk' => now()->subHours(1),
            'waktu_keluar' => now(),
            'durasi_jam' => 1,
            'biaya_total' => 2000,
            'status' => 'keluar', // Sudah checkout
        ]);

        $response = $this->actingAs($this->petugas)->post(route('gate.out.store'), [
            'id_parkir' => $transaksi->id_parkir,
            'uang_dibayar' => 2000,
        ]);

        // Harus error karena sudah keluar (controller return status 400 Bad Request)
        $response->assertStatus(400);
    }

    /**
     * Test: Plat nomor disanitasi dengan benar.
     */
    public function test_plat_nomor_is_sanitized(): void
    {
        $response = $this->actingAs($this->petugas)->post(route('gate.in.store'), [
            'plat_nomor' => 'b-1234-xyz', // lowercase dan ada strip
            'jenis_kendaraan' => 'motor',
            'id_area' => $this->area->id_area,
            'metode_entry' => 'Manual',
        ]);

        // Plat nomor harus tersimpan dalam format sanitized
        $this->assertDatabaseHas('transaksi', [
            'plat_nomor' => 'B1234XYZ', // Uppercase, tanpa strip
        ]);
    }
}

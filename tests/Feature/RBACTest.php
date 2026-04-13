<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature Test untuk Role-Based Access Control (RBAC).
 * Memastikan setiap role hanya bisa mengakses halaman yang sesuai hak aksesnya.
 */
class RBACTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $petugas;
    protected User $owner;
    protected User $inactiveUser;

    /**
     * Setup user untuk setiap role.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'nama_lengkap' => 'Admin Test',
            'username' => 'admin_test',
            'password' => 'password',
            'role' => 'admin',
            'status_aktif' => 'aktif',
        ]);

        $this->petugas = User::create([
            'nama_lengkap' => 'Petugas Test',
            'username' => 'petugas_test',
            'password' => 'password',
            'role' => 'petugas',
            'status_aktif' => 'aktif',
        ]);

        $this->owner = User::create([
            'nama_lengkap' => 'Owner Test',
            'username' => 'owner_test',
            'password' => 'password',
            'role' => 'owner',
            'status_aktif' => 'aktif',
        ]);

        $this->inactiveUser = User::create([
            'nama_lengkap' => 'Banned User',
            'username' => 'banned_test',
            'password' => 'password',
            'role' => 'admin',
            'status_aktif' => 'nonaktif', // Nonaktif
        ]);
    }

    // ==========================================
    // ADMIN ACCESS TESTS
    // ==========================================

    /**
     * Test: Admin bisa akses halaman User Management.
     */
    public function test_admin_can_access_user_management(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.users.index'));
        $response->assertStatus(200);
    }

    /**
     * Test: Admin bisa akses halaman Tarif.
     */
    public function test_admin_can_access_tarif_management(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.tarifs.index'));
        $response->assertStatus(200);
    }

    /**
     * Test: Admin bisa akses halaman Area Parkir.
     */
    public function test_admin_can_access_area_management(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.areas.index'));
        $response->assertStatus(200);
    }

    /**
     * Test: Admin bisa akses halaman Laporan.
     */
    public function test_admin_can_access_laporan(): void
    {
        $response = $this->actingAs($this->admin)->get(route('admin.laporan.index'));
        $response->assertStatus(200);
    }

    // ==========================================
    // PETUGAS ACCESS TESTS
    // ==========================================

    /**
     * Test: Petugas bisa akses Gate In.
     */
    public function test_petugas_can_access_gate_in(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('gate.in.index'));
        $response->assertStatus(200);
    }

    /**
     * Test: Petugas bisa akses Gate Out.
     */
    public function test_petugas_can_access_gate_out(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('gate.out'));
        $response->assertStatus(200);
    }

    /**
     * Test: Petugas TIDAK bisa akses halaman Admin (User Management).
     */
    public function test_petugas_cannot_access_admin_pages(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('admin.users.index'));
        // Harus redirect ke login/dashboard atau return 403
        $this->assertTrue(
            $response->isRedirection() || $response->status() === 403,
            'Petugas seharusnya tidak bisa akses halaman admin'
        );
    }

    /**
     * Test: Petugas TIDAK bisa akses Laporan.
     */
    public function test_petugas_cannot_access_laporan(): void
    {
        $response = $this->actingAs($this->petugas)->get(route('admin.laporan.index'));
        $this->assertTrue(
            $response->isRedirection() || $response->status() === 403,
            'Petugas seharusnya tidak bisa akses laporan'
        );
    }

    // ==========================================
    // OWNER ACCESS TESTS
    // ==========================================

    /**
     * Test: Owner bisa akses Laporan.
     */
    public function test_owner_can_access_laporan(): void
    {
        $response = $this->actingAs($this->owner)->get(route('admin.laporan.index'));
        $response->assertStatus(200);
    }

    /**
     * Test: Owner TIDAK bisa akses halaman Gate In/Out.
     */
    public function test_owner_cannot_access_gate_pages(): void
    {
        $response = $this->actingAs($this->owner)->get(route('gate.in.index'));
        $this->assertTrue(
            $response->isRedirection() || $response->status() === 403,
            'Owner seharusnya tidak bisa akses halaman gate'
        );
    }

    // ==========================================
    // INACTIVE USER TESTS
    // ==========================================

    /**
     * Test: User nonaktif tidak bisa login.
     */
    public function test_inactive_user_cannot_login(): void
    {
        $response = $this->post(route('login'), [
            'username' => 'banned_test',
            'password' => 'password',
        ]);

        // Setelah login attempt, user harus di-logout karena nonaktif
        $this->assertGuest();
    }

    /**
     * Test: User nonaktif yang sudah login akan di-redirect.
     */
    public function test_inactive_user_redirected_on_access(): void
    {
        // Paksa login (bypass middleware) untuk simulasi
        $response = $this->actingAs($this->inactiveUser)->get(route('admin.users.index'));

        // Middleware RoleMiddleware harus logout dan redirect
        $this->assertTrue(
            $response->isRedirection() || $response->status() === 403,
            'User nonaktif seharusnya tidak bisa akses halaman'
        );
    }

    // ==========================================
    // UNAUTHENTICATED ACCESS TESTS
    // ==========================================

    /**
     * Test: Unauthenticated user di-redirect ke login.
     */
    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $response = $this->get(route('admin.users.index'));
        $response->assertRedirect(route('login'));
    }

    /**
     * Test: Halaman publik (Welcome) bisa diakses tanpa login.
     */
    public function test_public_pages_are_accessible(): void
    {
        $this->get('/')->assertStatus(200);
    }
}

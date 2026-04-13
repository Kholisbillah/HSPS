<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Webhook\DokuWebhookController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/* |-------------------------------------------------------------------------- | Web Routes |-------------------------------------------------------------------------- */

Route::get('/', function () {
    // Hitung slot tersedia dari database (bukan hardcoded)
    $totalKapasitas = \App\Models\AreaParkir::sum('kapasitas');
    $totalTerisi = \App\Models\AreaParkir::sum('terisi');

    return Inertia::render('Welcome', [
    'canLogin' => Route::has('login'),
    'canRegister' => Route::has('register'),
    'laravelVersion' => Application::VERSION,
    'phpVersion' => PHP_VERSION,
    'sisa_slot' => $totalKapasitas - $totalTerisi,
    ]);
});

Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

Route::get('/services', function () {
    // Ambil tarif dari database (bukan hardcoded)
    $tarifs = \App\Models\Tarif::all();

    return Inertia::render('Services', [
    'tarifs' => $tarifs,
    ]);
})->name('services');

Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class , 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class , 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class , 'destroy'])->name('profile.destroy');

    // Verifikasi password untuk keamanan akses gate kiosk
    Route::post('/password/verify', function (\Illuminate\Http\Request $request) {
        $request->validate(['password' => 'required|string']);

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $request->user()->password)) {
            return response()->json(['status' => 'error', 'message' => 'Password salah.'], 422);
        }

        return response()->json(['status' => 'success']);
    })->name('password.verify');

    // =====================================================================
    // ADMIN ROUTES
    // =====================================================================
    Route::middleware(['role:admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
        Route::resource('areas', \App\Http\Controllers\Admin\AreaParkirController::class);
        Route::resource('tarifs', \App\Http\Controllers\Admin\TarifController::class);

        // CRUD Denda Tiket Hilang — menggunakan model Tarif dengan tipe_tarif='denda'
        Route::resource('dendas', \App\Http\Controllers\Admin\DendaController::class)
            ->parameters(['dendas' => 'denda'])
            ->except(['create', 'show', 'edit']);

        Route::resource('kendaraans', \App\Http\Controllers\Admin\KendaraanController::class);

        // Gate Management (Admin Only)
        Route::get('/gates', [\App\Http\Controllers\Admin\GateManagementController::class, 'index'])->name('gates.index');
        Route::post('/gates/{kodeGate}/toggle', [\App\Http\Controllers\Admin\GateManagementController::class, 'toggle'])->name('gates.toggle');
        Route::post('/gates/open-all', [\App\Http\Controllers\Admin\GateManagementController::class, 'openAll'])->name('gates.open-all');
        Route::post('/gates/close-all', [\App\Http\Controllers\Admin\GateManagementController::class, 'closeAll'])->name('gates.close-all');
    });

    // Laporan Routes (Admin & Owner)
    Route::middleware(['role:admin,owner'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/laporan', [\App\Http\Controllers\Admin\LaporanController::class , 'index'])->name('laporan.index');
    });

    // =====================================================================
    // PETUGAS ROUTES (Legacy — dipertahankan untuk backward compatibility)
    // =====================================================================
    Route::middleware(['role:petugas,admin', 'throttle:60,1'])->prefix('petugas')->group(function () {
        // Visualisasi Area Parkir
        Route::get('/area-monitor', [\App\Http\Controllers\Petugas\AreaVisualisasiController::class , 'index'])->name('area.monitor');

        // Legacy Gate In (tetap ada, tapi routing utama ke flow baru)
        Route::get('/gate-in', [\App\Http\Controllers\Petugas\TransaksiController::class , 'gateIn'])->name('gate.in');
        Route::post('/gate-in', [\App\Http\Controllers\Petugas\TransaksiController::class , 'storeGateIn'])->name('gate.in.store');
        Route::post('/gate-in/check-vip', [\App\Http\Controllers\Petugas\TransaksiController::class , 'checkVip'])->name('gate.in.check-vip');

        // Legacy Gate Out
        Route::get('/gate-out', [\App\Http\Controllers\Petugas\GateOutController::class , 'index'])->name('gate.out');
        Route::post('/gate-out/scan', [\App\Http\Controllers\Petugas\GateOutController::class , 'scan'])->name('gate.out.scan');
        Route::post('/gate-out/process', [\App\Http\Controllers\Petugas\GateOutController::class , 'store'])->name('gate.out.store');
    });

    // =====================================================================
    // NEW GATE ROUTES (Multi-Gate Otomatis)
    // =====================================================================
    Route::middleware(['role:petugas,admin', 'throttle:120,1'])->prefix('gate')->name('gate.new.')->group(function () {
        // Gate Masuk (Self-Service Touchscreen)
        Route::get('/masuk/{gateType}', [\App\Http\Controllers\Gate\GateController::class, 'showGateIn'])->name('in.show');
        Route::post('/masuk/{gateType}', [\App\Http\Controllers\Gate\GateController::class, 'processGateIn'])->name('in.process');
        Route::post('/masuk/{gateType}/check-vip', [\App\Http\Controllers\Gate\GateController::class, 'checkVip'])->name('in.check-vip');

        // Gate Keluar (Cash & Cashless)
        Route::get('/keluar/{gateNum}', [\App\Http\Controllers\Gate\GateController::class, 'showGateOut'])->name('out.show');
        Route::post('/keluar/{gateNum}/scan', [\App\Http\Controllers\Gate\GateController::class, 'scanTicket'])->name('out.scan');
        Route::post('/keluar/{gateNum}/process', [\App\Http\Controllers\Gate\GateController::class, 'processGateOut'])->name('out.process');
        Route::post('/keluar/{gateNum}/check-vip', [\App\Http\Controllers\Gate\GateController::class, 'checkVipExit'])->name('out.check-vip');

        // Gate Keluar — DOKU QRIS Cashless (Gate 3 & 4)
        Route::post('/keluar/{gateNum}/generate-qris', [\App\Http\Controllers\Gate\GateController::class, 'generateQris'])->name('out.generate-qris');
        Route::post('/keluar/{gateNum}/check-qris', [\App\Http\Controllers\Gate\GateController::class, 'checkQrisStatus'])->name('out.check-qris');

        // Manual Override (Petugas/Admin)
        Route::post('/manual-open', [\App\Http\Controllers\Gate\GateController::class, 'manualOpen'])->name('manual-open');
    });
});

// =====================================================================
// WEBHOOK ROUTES (Server-to-Server, tanpa auth & CSRF)
// =====================================================================
Route::post('/webhook/doku/payment', [DokuWebhookController::class, 'handle'])->name('webhook.doku');

require __DIR__ . '/auth.php';

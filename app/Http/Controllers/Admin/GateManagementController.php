<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Gate;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controller untuk manajemen gate parkir oleh Admin.
 * Memungkinkan admin untuk melihat status, mengaktifkan/menonaktifkan gate,
 * dan melakukan override darurat (buka semua gate).
 */
class GateManagementController extends Controller
{
    /**
     * Tampilkan halaman manajemen gate dengan status realtime.
     */
    public function index()
    {
        $gates = Gate::orderByRaw("FIELD(direction, 'masuk', 'keluar')")
            ->orderBy('kode_gate')
            ->get();

        return Inertia::render('Admin/Gates/Index', [
            'gates' => $gates,
        ]);
    }

    /**
     * Toggle status aktif/nonaktif gate tertentu.
     */
    public function toggle(Request $request, $kodeGate)
    {
        $gate = Gate::where('kode_gate', $kodeGate)->firstOrFail();
        $gate->is_active = !$gate->is_active;
        $gate->save();

        $status = $gate->is_active ? 'DIAKTIFKAN' : 'DINONAKTIFKAN';
        LogAktivitas::catat("Gate {$gate->nama_gate} {$status} oleh Admin.");

        return redirect()->back()->with('success', "Gate {$gate->nama_gate} berhasil {$status}.");
    }

    /**
     * Buka semua gate (darurat) — mengaktifkan semua gate.
     */
    public function openAll()
    {
        Gate::query()->update(['is_active' => true]);

        LogAktivitas::catat('DARURAT: Semua gate diaktifkan oleh Admin.');

        return redirect()->back()->with('success', 'Semua gate berhasil diaktifkan!');
    }

    /**
     * Nonaktifkan semua gate (lockdown).
     */
    public function closeAll()
    {
        Gate::query()->update(['is_active' => false]);

        LogAktivitas::catat('LOCKDOWN: Semua gate dinonaktifkan oleh Admin.');

        return redirect()->back()->with('success', 'Semua gate berhasil dinonaktifkan (lockdown).');
    }
}

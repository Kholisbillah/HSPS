<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tarif;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controller CRUD untuk mengelola tarif denda tiket/karcis hilang.
 * Tarif denda disimpan di tabel `tarif` dengan kolom `tipe_tarif = 'denda'`.
 * Biaya denda bersifat flat (bukan per jam), ditambahkan di atas biaya parkir normal.
 */
class DendaController extends Controller
{
    /**
     * Tampilkan halaman manajemen denda tiket hilang.
     * Hanya menampilkan tarif bertipe 'denda'.
     */
    public function index()
    {
        // Ambil semua tarif denda, urutkan berdasarkan jenis kendaraan
        $dendas = Tarif::where('tipe_tarif', 'denda')
            ->orderBy('jenis_kendaraan', 'asc')
            ->paginate(10);

        return Inertia::render('Admin/Denda/Index', [
            'dendas' => $dendas,
        ]);
    }

    /**
     * Simpan tarif denda baru.
     * Validasi: hanya satu denda per jenis_kendaraan.
     */
    public function store(Request $request)
    {
        $request->validate([
            'jenis_kendaraan' => 'required|in:motor,mobil,lainnya',
            'tarif_per_jam'   => 'required|numeric|min:1000', // Minimum Rp 1.000
        ]);

        // Cek apakah sudah ada tarif denda untuk jenis kendaraan ini
        $exists = Tarif::where('tipe_tarif', 'denda')
            ->where('jenis_kendaraan', $request->jenis_kendaraan)
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 
                'Tarif denda untuk ' . $request->jenis_kendaraan . ' sudah ada. Silakan edit tarif yang sudah ada.'
            );
        }

        // Buat tarif denda baru (tarif_jam_selanjutnya = 0 karena flat rate)
        Tarif::create([
            'jenis_kendaraan'      => $request->jenis_kendaraan,
            'tarif_per_jam'        => $request->tarif_per_jam,
            'tarif_jam_selanjutnya' => 0, // Denda flat, tidak per jam
            'tipe_tarif'           => 'denda',
        ]);

        // Log aktivitas perubahan denda
        LogAktivitas::catat(
            'Admin menambahkan Denda Tiket Hilang: ' . $request->jenis_kendaraan
            . ' sebesar Rp ' . number_format($request->tarif_per_jam)
        );

        return redirect()->back()->with('success', 'Tarif denda tiket hilang berhasil ditambahkan.');
    }

    /**
     * Perbarui tarif denda yang sudah ada.
     * Hanya tarif_per_jam yang bisa diubah (jenis_kendaraan terkunci).
     */
    public function update(Request $request, Tarif $denda)
    {
        // Pastikan yang diedit adalah tarif bertipe denda
        if ($denda->tipe_tarif !== 'denda') {
            return redirect()->back()->with('error', 'Data ini bukan tarif denda.');
        }

        $request->validate([
            'tarif_per_jam' => 'required|numeric|min:1000', // Minimum Rp 1.000
        ]);

        // Simpan nilai lama untuk log
        $oldAmount = $denda->tarif_per_jam;

        // Update hanya biaya denda (flat rate)
        $denda->update([
            'tarif_per_jam' => $request->tarif_per_jam,
        ]);

        // Log aktivitas perubahan denda
        LogAktivitas::catat(
            'Admin memperbarui Denda Tiket Hilang ' . $denda->jenis_kendaraan
            . ': Rp ' . number_format($oldAmount) . ' → Rp ' . number_format($request->tarif_per_jam)
        );

        return redirect()->back()->with('success', 'Tarif denda tiket hilang berhasil diperbarui.');
    }

    /**
     * Hapus tarif denda.
     * PERINGATAN: Jika denda dihapus, sistem tidak bisa mengenakan denda untuk jenis kendaraan tersebut.
     */
    public function destroy(Tarif $denda)
    {
        // Pastikan yang dihapus adalah tarif bertipe denda
        if ($denda->tipe_tarif !== 'denda') {
            return redirect()->back()->with('error', 'Data ini bukan tarif denda.');
        }

        $jenisKendaraan = $denda->jenis_kendaraan;
        $amount = $denda->tarif_per_jam;
        $denda->delete();

        // Log aktivitas penghapusan denda
        LogAktivitas::catat(
            'Admin MENGHAPUS Denda Tiket Hilang: ' . $jenisKendaraan
            . ' (Rp ' . number_format($amount) . ')'
        );

        return redirect()->back()->with('success', 'Tarif denda tiket hilang berhasil dihapus.');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tarif;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\LogAktivitas;

class TarifController extends Controller
{
    public function index()
    {
        // Hanya tampilkan tarif normal (bukan denda) di halaman manajemen tarif
        $tarifs = Tarif::where('tipe_tarif', 'normal')->paginate(10);

        return Inertia::render('Admin/Tarifs/Index', [
            'tarifs' => $tarifs,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'jenis_kendaraan' => 'required|in:motor,mobil,lainnya|unique:tarif,jenis_kendaraan',
            'tarif_per_jam' => 'required|numeric|min:0',
            'tarif_jam_selanjutnya' => 'required|numeric|min:0', // Tarif jam ke-2 dst
        ]);

        // Hanya ambil field yang diizinkan (mencegah mass assignment)
        Tarif::create($request->only(['jenis_kendaraan', 'tarif_per_jam', 'tarif_jam_selanjutnya']));

        // Log aktivitas dengan detail tarif jam pertama & selanjutnya
        LogAktivitas::catat(
            'Admin menambahkan Tarif: ' . $request->jenis_kendaraan
            . ' (Jam Pertama: Rp ' . number_format($request->tarif_per_jam)
            . ' | Jam Selanjutnya: Rp ' . number_format($request->tarif_jam_selanjutnya) . ')'
        );

        return redirect()->back()->with('success', 'Tarif berhasil ditambahkan.');
    }

    public function update(Request $request, Tarif $tarif)
    {
        $request->validate([
            'tarif_per_jam' => 'required|numeric|min:0',
            'tarif_jam_selanjutnya' => 'required|numeric|min:0', // Tarif jam ke-2 dst
        ]);

        $tarif->update($request->only(['tarif_per_jam', 'tarif_jam_selanjutnya']));

        // Log aktivitas dengan detail tarif lengkap
        LogAktivitas::catat(
            'Admin memperbarui Tarif ' . $tarif->jenis_kendaraan
            . ' (Jam Pertama: Rp ' . number_format($request->tarif_per_jam)
            . ' | Jam Selanjutnya: Rp ' . number_format($request->tarif_jam_selanjutnya) . ')'
        );

        return redirect()->back()->with('success', 'Tarif berhasil diperbarui.');
    }

    public function destroy(Tarif $tarif)
    {
        // Cegah penghapusan tarif jika masih ada transaksi aktif (status masuk)
        $activeTransactions = \App\Models\Transaksi::where('id_tarif', $tarif->id_tarif)
            ->where('status', 'masuk')
            ->count();

        if ($activeTransactions > 0) {
            return redirect()->back()->with('error', 'Tarif tidak dapat dihapus karena masih ada ' . $activeTransactions . ' kendaraan yang sedang parkir menggunakan tarif ini.');
        }

        $jenisKendaraan = $tarif->jenis_kendaraan;
        $tarif->delete();

        LogAktivitas::catat('Admin MENGHAPUS Tarif: ' . $jenisKendaraan);

        return redirect()->back()->with('success', 'Tarif berhasil dihapus.');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Kendaraan;
use App\Models\LogAktivitas;
use App\Http\Requests\StoreKendaraanRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KendaraanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Kendaraan::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('plat_nomor', 'like', "%{$search}%")
                ->orWhere('pemilik', 'like', "%{$search}%");
        }

        $kendaraans = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Kendaraan/Index', [
            'kendaraans' => $kendaraans,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreKendaraanRequest $request)
    {
        // Validasi & sanitasi sudah dilakukan oleh StoreKendaraanRequest
        $validated = $request->validated();

        $validated['id_user'] = auth()->id();
        Kendaraan::create($validated);

        LogAktivitas::catat('Admin mendaftarkan Member baru: ' . $validated['plat_nomor']);

        return redirect()->back()->with('success', 'Data Member Kendaraan Berhasil Ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreKendaraanRequest $request, Kendaraan $kendaraan)
    {
        // Validasi & sanitasi sudah dilakukan oleh StoreKendaraanRequest
        $validated = $request->validated();

        $kendaraan->update($validated);

        return redirect()->back()->with('success', 'Data Member Berhasil Diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kendaraan $kendaraan)
    {
        $platNomor = $kendaraan->plat_nomor;
        $kendaraan->delete();

        LogAktivitas::catat('Admin MENGHAPUS Member: ' . $platNomor);

        return redirect()->back()->with('success', 'Data Member Dihapus.');
    }
}

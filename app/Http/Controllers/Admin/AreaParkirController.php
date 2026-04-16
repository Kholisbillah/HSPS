<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AreaParkir;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AreaParkirController extends Controller
{
    public function index(Request $request)
    {
        $areas = AreaParkir::query()
            ->when($request->search, function ($query, $search) {
            $query->where('nama_area', 'like', "%{$search}%");
        })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Areas/Index', [
            'areas' => $areas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_area' => 'required|string|max:255|unique:area_parkir',
            'kapasitas' => 'required|integer|min:1',
            'peruntukan' => 'required|in:motor,mobil,lainnya',
        ]);

        AreaParkir::create([
            'nama_area' => $request->nama_area,
            'kapasitas' => $request->kapasitas,
            'terisi' => 0,
            'peruntukan' => $request->peruntukan,
        ]);

        \App\Models\LogAktivitas::catat('Admin menambahkan Area Parkir: ' . $request->nama_area);

        return redirect()->back()->with('success', 'Area parkir berhasil ditambahkan.');
    }

    public function update(Request $request, AreaParkir $area)
    {
        $request->validate([
            'nama_area' => 'required|string|max:255|unique:area_parkir,nama_area,' . $area->id_area . ',id_area',
            'kapasitas' => 'required|integer|min:1',
            'peruntukan' => 'required|in:motor,mobil,lainnya',
        ]);

        // Pencegahan kapasitas < terisi
        if ($request->kapasitas < $area->terisi) {
            return redirect()->back()->with('error', 'Kapasitas tidak boleh lebih kecil dari jumlah terisi saat ini.');
        }

        $area->update($request->only('nama_area', 'kapasitas', 'peruntukan'));

        return redirect()->back()->with('success', 'Area parkir berhasil diperbarui.');
    }

    public function destroy(AreaParkir $area)
    {
        if ($area->terisi > 0) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus area yang sedang terisi.');
        }

        $namaArea = $area->nama_area;
        $area->delete();

        \App\Models\LogAktivitas::catat('Admin MENGHAPUS Area Parkir: ' . $namaArea);

        return redirect()->back()->with('success', 'Area parkir berhasil dihapus.');
    }
}

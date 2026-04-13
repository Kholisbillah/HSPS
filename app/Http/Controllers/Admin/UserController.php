<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->search) {
            $query->where('nama_lengkap', 'like', '%' . $request->search . '%')
                ->orWhere('username', 'like', '%' . $request->search . '%');
        }

        $users = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:admin,petugas,owner',
        ]);

        // Password TIDAK di-Hash::make() di sini karena Model User sudah punya
        // cast 'password' => 'hashed' yang otomatis hash saat assign
        User::create([
            'nama_lengkap' => $request->nama_lengkap,
            'username' => $request->username,
            'password' => $request->password,
            'role' => $request->role,
            'status_aktif' => 'aktif', // Enum default: 'aktif' (sesuai skema database)
        ]);

        \App\Models\LogAktivitas::catat('Admin menambahkan User baru: ' . $request->username . ' (Role: ' . $request->role . ')');

        return redirect()->back()->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id_user . ',id_user',
            'role' => 'required|in:admin,petugas,owner',
            'status_aktif' => 'required|in:aktif,nonaktif', // Enum: sesuai skema database
        ]);

        $data = [
            'nama_lengkap' => $request->nama_lengkap,
            'username' => $request->username,
            'role' => $request->role,
            'status_aktif' => $request->status_aktif,
        ];

        if ($request->filled('password')) {
            $request->validate([
                'password' => ['confirmed', Rules\Password::defaults()],
            ]);
            // Biarkan Model cast 'hashed' yang menangani hashing
            $data['password'] = $request->password;
        }

        $user->update($data);

        \App\Models\LogAktivitas::catat('Admin memperbarui User: ' . $user->username);

        return redirect()->back()->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if ($user->id_user === auth()->id()) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus akun sendiri.');
        }

        $username = $user->username;
        $user->delete();

        \App\Models\LogAktivitas::catat('Admin MENGHAPUS User: ' . $username);

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }
}

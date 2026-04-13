<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request untuk validasi data kendaraan member (store & update).
 * Sanitasi plat nomor dilakukan di prepareForValidation().
 */
class StoreKendaraanRequest extends FormRequest
{
    /**
     * Tentukan apakah user boleh melakukan request ini.
     */
    public function authorize(): bool
    {
        // Akses dikontrol oleh middleware role (admin)
        return true;
    }

    /**
     * Sanitasi input sebelum divalidasi.
     * Plat nomor di-uppercase dan dihapus karakter non-alfanumerik.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('plat_nomor')) {
            $this->merge([
                'plat_nomor' => preg_replace('/[^A-Z0-9]/', '', strtoupper($this->plat_nomor)),
            ]);
        }
    }

    /**
     * Aturan validasi untuk data kendaraan member.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        // Cek apakah ini operasi update (route parameter 'kendaraan' ada)
        $kendaraanId = $this->route('kendaraan')?->id_kendaraan ?? $this->route('kendaraan');

        // Aturan unique plat_nomor: kecualikan record saat ini jika update
        $uniqueRule = $kendaraanId
            ? 'unique:kendaraan,plat_nomor,' . $kendaraanId . ',id_kendaraan'
            : 'unique:kendaraan,plat_nomor';

        return [
            'plat_nomor' => ['required', 'string', 'min:3', 'max:15', $uniqueRule],
            'jenis_kendaraan' => 'required|in:motor,mobil,lainnya',
            'pemilik' => 'required|string|max:255',
            'warna' => 'required|string|max:255',
        ];
    }

    /**
     * Pesan error custom dalam Bahasa Indonesia.
     */
    public function messages(): array
    {
        return [
            'plat_nomor.required' => 'Plat nomor wajib diisi.',
            'plat_nomor.min' => 'Plat nomor minimal 3 karakter.',
            'plat_nomor.max' => 'Plat nomor maksimal 15 karakter.',
            'plat_nomor.unique' => 'Plat nomor sudah terdaftar sebagai VIP.',
            'jenis_kendaraan.required' => 'Jenis kendaraan wajib dipilih.',
            'jenis_kendaraan.in' => 'Jenis kendaraan harus motor, mobil, atau lainnya.',
            'pemilik.required' => 'Nama pemilik wajib diisi.',
            'pemilik.max' => 'Nama pemilik maksimal 255 karakter.',
            'warna.required' => 'Warna kendaraan wajib diisi.',
            'warna.max' => 'Warna kendaraan maksimal 255 karakter.',
        ];
    }
}

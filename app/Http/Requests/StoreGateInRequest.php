<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Form Request untuk validasi Gate In (kendaraan masuk).
 * Sanitasi plat nomor dilakukan di prepareForValidation() sebelum validasi.
 */
class StoreGateInRequest extends FormRequest
{
    /**
     * Tentukan apakah user boleh melakukan request ini.
     */
    public function authorize(): bool
    {
        // Akses dikontrol oleh middleware role (petugas/admin)
        return true;
    }

    /**
     * Sanitasi input sebelum divalidasi.
     * Sesuai Security Checklist Poin 2A: bersihkan hasil OCR/QR.
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
     * Aturan validasi untuk Gate In.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'plat_nomor' => 'required|string|min:3|max:15', // Min 3 karakter (format check)
            'jenis_kendaraan' => 'required|in:motor,mobil,lainnya',
            'id_area' => 'required|exists:area_parkir,id_area',
            'metode_entry' => 'required|in:OCR,QR,Manual', // Metode input: OCR/QR/Manual
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
            'jenis_kendaraan.required' => 'Jenis kendaraan wajib dipilih.',
            'jenis_kendaraan.in' => 'Jenis kendaraan harus motor, mobil, atau lainnya.',
            'id_area.required' => 'Area parkir wajib dipilih.',
            'id_area.exists' => 'Area parkir yang dipilih tidak valid.',
            'metode_entry.required' => 'Metode entry wajib diisi.',
            'metode_entry.in' => 'Metode entry harus OCR, QR, atau Manual.',
        ];
    }
}

<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Transaksi;
use App\Services\DokuPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Controller untuk menangani webhook/notification dari DOKU.
 * Endpoint ini dipanggil oleh server DOKU saat pembayaran QRIS berhasil.
 *
 * KEAMANAN:
 * - Route di-exclude dari CSRF middleware (server-to-server call)
 * - Signature divalidasi sebelum processing
 * - Menggunakan DB::transaction() + lockForUpdate() di service
 */
class DokuWebhookController extends Controller
{
    /**
     * Handle incoming webhook notification dari DOKU.
     * Dipanggil saat user berhasil membayar via QRIS.
     *
     * Flow:
     * 1. Log seluruh request (untuk audit trail)
     * 2. Validasi signature dari DOKU
     * 3. Cari transaksi berdasarkan partnerReferenceNo
     * 4. Jalankan confirmPayment() jika belum diproses
     */
    public function handle(Request $request, DokuPaymentService $dokuService)
    {
        // Log seluruh webhook masuk untuk audit trail & debugging
        Log::info('DOKU Webhook Received', [
            'headers' => $request->headers->all(),
            'body' => $request->all(),
        ]);

        // Validasi signature — tolak jika tidak valid
        if (!$dokuService->validateWebhook($request)) {
            Log::warning('DOKU Webhook: Signature tidak valid, request ditolak');

            return response()->json([
                'responseCode' => '4017300',
                'responseMessage' => 'Unauthorized. Invalid signature.',
            ], 401);
        }

        // Ambil reference number dari body webhook
        $body = $request->all();
        $referenceNo = $body['partnerReferenceNo']
            ?? $body['originalPartnerReferenceNo']
            ?? null;

        // Validasi: pastikan reference number ada
        if (!$referenceNo) {
            Log::warning('DOKU Webhook: partnerReferenceNo tidak ditemukan di body');

            return response()->json([
                'responseCode' => '4007300',
                'responseMessage' => 'Bad Request. Missing partnerReferenceNo.',
            ], 400);
        }

        // Cari transaksi berdasarkan doku_reference_no
        $transaksi = Transaksi::where('doku_reference_no', $referenceNo)->first();

        if (!$transaksi) {
            Log::warning('DOKU Webhook: Transaksi tidak ditemukan', [
                'reference' => $referenceNo,
            ]);

            return response()->json([
                'responseCode' => '4047300',
                'responseMessage' => 'Transaction not found.',
            ], 404);
        }

        // Skip jika transaksi sudah selesai (idempotent)
        if ($transaksi->status === 'keluar') {
            Log::info('DOKU Webhook: Transaksi sudah diproses sebelumnya', [
                'id_parkir' => $transaksi->id_parkir,
                'reference' => $referenceNo,
            ]);

            return response()->json([
                'responseCode' => '2007300',
                'responseMessage' => 'Success. Already processed.',
            ]);
        }

        try {
            // Konfirmasi pembayaran — update transaksi, decrement area, dll
            $dokuService->confirmPayment(
                $transaksi->id_parkir,
                $transaksi->gate_type ?? 'gate_out_cashless'
            );

            Log::info('DOKU Webhook: Pembayaran berhasil dikonfirmasi', [
                'id_parkir' => $transaksi->id_parkir,
                'reference' => $referenceNo,
            ]);

            return response()->json([
                'responseCode' => '2007300',
                'responseMessage' => 'Success.',
            ]);
        } catch (\Exception $e) {
            Log::error('DOKU Webhook: Gagal konfirmasi pembayaran', [
                'id_parkir' => $transaksi->id_parkir,
                'reference' => $referenceNo,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'responseCode' => '5007300',
                'responseMessage' => 'Internal Server Error.',
            ], 500);
        }
    }
}

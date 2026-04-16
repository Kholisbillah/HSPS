<?php

namespace App\Services;

use App\Models\AreaParkir;
use App\Models\Kendaraan;
use App\Models\LogAktivitas;
use App\Models\Transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service class untuk integrasi pembayaran DOKU SNAP QRIS.
 * Menggunakan pendekatan hybrid: token/signature dari DOKU SDK,
 * raw HTTP call untuk endpoint QRIS yang belum di-support library.
 *
 * Alur: generateQris() → checkPaymentStatus() → confirmPayment()
 */
class DokuPaymentService
{
    // Kredensial DOKU dari .env
    private string $clientId;
    private string $secretKey;
    private string $privateKey;
    private string $dokuPublicKey;
    private string $merchantId;
    private string $baseUrl;
    private bool $isProduction;

    public function __construct()
    {
        // Baca kredensial dari environment (.env)
        $this->clientId = env('DOKU_CLIENT_ID', '');
        $this->secretKey = env('DOKU_SECRET_KEY', '');
        $this->privateKey = env('DOKU_PRIVATE_KEY', '');
        $this->dokuPublicKey = env('DOKU_PUBLIC_KEY', '');
        // merchantId terpisah dari clientId — cari di DOKU Dashboard > Business Account > Service
        $this->merchantId = env('DOKU_MERCHANT_ID', '');
        $this->isProduction = filter_var(env('DOKU_IS_PRODUCTION', false), FILTER_VALIDATE_BOOLEAN);

        // Tentukan base URL: sandbox vs production
        $this->baseUrl = $this->isProduction
            ? 'https://api.doku.com'
            : 'https://api-sandbox.doku.com';
    }

    // ========================================================================
    // PUBLIC METHODS
    // ========================================================================

    /**
     * Generate QRIS dari DOKU untuk pembayaran parkir.
     * Mengembalikan QR content string yang bisa di-render di frontend.
     *
     * @param int $idParkir ID transaksi parkir
     * @param float $amount Jumlah biaya yang harus dibayar (Rupiah)
     * @param string $gateType Kode gate keluar (e.g., gate_out_3)
     * @return array ['qrContent', 'referenceNo', 'expiredAt']
     * @throws \Exception Jika gagal generate QRIS
     */
    public function generateQris(int $idParkir, float $amount, string $gateType): array
    {
        // Buat reference number unik: PKR-{id_parkir}-{timestamp}
        $referenceNo = 'PKR-' . $idParkir . '-' . now()->format('YmdHis');

        // QRIS berlaku 5 menit dari sekarang (format ISO 8601 WIB)
        $validityPeriod = now()->addMinutes(5)->setTimezone('+07:00')->format('Y-m-d\TH:i:sP');

        // ================================================================
        // SANDBOX SIMULATOR MODE
        // DOKU Sandbox TIDAK mendukung QRIS — selalu return 5004701.
        // Mode ini mensimulasi response QRIS untuk testing flow cashless.
        // Auto-payment akan dikonfirmasi via checkPaymentStatus() setelah 8 detik.
        // ================================================================
        if (!$this->isProduction) {
            Log::info('DOKU QRIS [SIMULATOR]: Mode sandbox aktif, generate QRIS simulasi', [
                'id_parkir' => $idParkir,
                'amount' => $amount,
                'gate' => $gateType,
            ]);

            // Simpan reference ke transaksi + simpan timestamp simulasi di cache
            Transaksi::where('id_parkir', $idParkir)->update([
                'doku_reference_no' => $referenceNo,
            ]);

            // Cache waktu generate untuk simulasi delay pembayaran (8 detik)
            Cache::put('doku_sim_' . $referenceNo, now()->timestamp, 600);

            // QR Content simulasi — format standar QRIS (dummy, tidak bisa di-scan e-wallet)
            $simulatedQrContent = '00020101021226680016COM.NOBUBANK.WWW01189360010300000'
                . '036802150002000000' . str_pad($idParkir, 6, '0', STR_PAD_LEFT)
                . '5204541253033605802ID5913HERMINA_PARK6007JAKARTA61051234'
                . '62070503***6304' . strtoupper(substr(md5($referenceNo), 0, 4));

            return [
                'qrContent' => $simulatedQrContent,
                'referenceNo' => $referenceNo,
                'expiredAt' => $validityPeriod,
                'isSimulator' => true, // Flag untuk frontend menampilkan badge simulator
            ];
        }

        // ================================================================
        // PRODUCTION MODE — Hit DOKU API nyata
        // ================================================================

        // Body request sesuai DOKU SNAP QRIS MPM Generate API
        // merchantId = Mall ID dari dashboard DOKU (BUKAN clientId/X-PARTNER-ID)
        $body = [
            'partnerReferenceNo' => $referenceNo,
            'amount' => [
                'value' => number_format($amount, 2, '.', ''),
                'currency' => 'IDR',
            ],
            'merchantId' => $this->merchantId,
            // DOKU: terminalId harus alphanumeric, 3-16 karakter
            'terminalId' => substr(preg_replace('/[^a-zA-Z0-9]/', '', $gateType), 0, 16),
            'validityPeriod' => $validityPeriod,
            // additionalInfo wajib untuk dynamic QRIS
            'additionalInfo' => [
                'isStatic' => false,
            ],
        ];

        // Hit DOKU API untuk generate QRIS
        $endpoint = '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate';
        $response = $this->callDokuApi('POST', $endpoint, $body);
        $data = $response->json();

        // Validasi response — pastikan qrContent ada
        if (!$response->successful() || empty($data['qrContent'])) {
            Log::error('DOKU QRIS Generate Error', [
                'status' => $response->status(),
                'response' => $data,
                'reference' => $referenceNo,
            ]);

            throw new \Exception(
                'Gagal generate QRIS: ' . ($data['responseMessage'] ?? 'Tidak ada response dari DOKU')
            );
        }

        // Simpan reference ke transaksi untuk tracking pembayaran
        Transaksi::where('id_parkir', $idParkir)->update([
            'doku_reference_no' => $referenceNo,
        ]);

        Log::info('DOKU QRIS Generated', [
            'id_parkir' => $idParkir,
            'reference' => $referenceNo,
            'amount' => $amount,
            'gate' => $gateType,
        ]);

        return [
            'qrContent' => $data['qrContent'],
            'referenceNo' => $referenceNo,
            'expiredAt' => $validityPeriod,
        ];
    }

    /**
     * Cek status pembayaran QRIS ke DOKU API.
     * Dipanggil oleh frontend setiap 3 detik (polling).
     *
     * Response code interpretasi:
     * - 2004800: Pembayaran berhasil (sudah dibayar)
     * - 2004700: Masih menunggu pembayaran
     * - Lainnya: Status tidak diketahui / error
     *
     * @param string $referenceNo partnerReferenceNo dari generateQris()
     * @return array ['isPaid', 'responseCode', 'message']
     */
    public function checkPaymentStatus(string $referenceNo): array
    {
        // ================================================================
        // SANDBOX SIMULATOR: Simulasi pembayaran otomatis setelah 8 detik
        // Memberikan waktu realistis untuk user melihat QR code sebelum
        // pembayaran "berhasil" secara otomatis.
        // ================================================================
        if (!$this->isProduction) {
            $simTimestamp = Cache::get('doku_sim_' . $referenceNo);

            if ($simTimestamp) {
                $elapsed = now()->timestamp - $simTimestamp;

                // Setelah 8 detik, simulasi pembayaran berhasil
                if ($elapsed >= 8) {
                    Log::info('DOKU QRIS [SIMULATOR]: Pembayaran otomatis dikonfirmasi', [
                        'reference' => $referenceNo,
                        'elapsed_seconds' => $elapsed,
                    ]);

                    // Hapus cache simulator
                    Cache::forget('doku_sim_' . $referenceNo);

                    return [
                        'isPaid' => true,
                        'responseCode' => '2004800',
                        'message' => 'Pembayaran berhasil (Simulator)',
                    ];
                }

                // Masih menunggu (belum 8 detik)
                return [
                    'isPaid' => false,
                    'responseCode' => '2004700',
                    'message' => 'Menunggu pembayaran... (' . (8 - $elapsed) . 's)',
                ];
            }

            // Reference tidak ditemukan di simulator cache
            return [
                'isPaid' => false,
                'responseCode' => '4044701',
                'message' => 'Reference tidak ditemukan (Simulator)',
            ];
        }

        // ================================================================
        // PRODUCTION MODE — Hit DOKU API nyata
        // ================================================================

        // Body request sesuai DOKU SNAP QRIS MPM Query API
        $body = [
            'originalPartnerReferenceNo' => $referenceNo,
            'serviceCode' => '47', // Service code untuk QRIS MPM
        ];

        $endpoint = '/snap-adapter/b2b/v1.0/qr/qr-mpm-query';
        $response = $this->callDokuApi('POST', $endpoint, $body);
        $data = $response->json();

        $responseCode = $data['responseCode'] ?? '';

        // Interpretasi response code dari DOKU
        if ($responseCode === '2004800') {
            // Pembayaran berhasil — QRIS sudah di-scan dan dibayar
            return [
                'isPaid' => true,
                'responseCode' => $responseCode,
                'message' => 'Pembayaran berhasil',
            ];
        } elseif ($responseCode === '2004700') {
            // Masih menunggu — user belum scan atau belum bayar
            return [
                'isPaid' => false,
                'responseCode' => $responseCode,
                'message' => 'Menunggu pembayaran',
            ];
        } else {
            // Response tidak dikenali — log untuk debugging
            Log::warning('DOKU QRIS Query: Response tidak dikenali', [
                'responseCode' => $responseCode,
                'response' => $data,
                'reference' => $referenceNo,
            ]);

            return [
                'isPaid' => false,
                'responseCode' => $responseCode,
                'message' => $data['responseMessage'] ?? 'Status tidak diketahui',
            ];
        }
    }

    /**
     * Konfirmasi pembayaran dan update transaksi di database.
     * Menggunakan DB::transaction() dengan lockForUpdate() untuk mencegah race condition.
     *
     * @param int $idParkir ID transaksi parkir
     * @param string $gateCode Kode gate keluar (e.g., gate_out_3)
     * @param bool $karcisHilang Apakah karcis hilang (untuk hitung denda)
     * @return int Biaya total yang dikonfirmasi (0 jika VIP)
     */
    public function confirmPayment(int $idParkir, string $gateCode, bool $karcisHilang = false): int
    {
        $transaksiService = new TransaksiService();

        return DB::transaction(function () use ($idParkir, $gateCode, $karcisHilang, $transaksiService) {
            // Lock baris transaksi untuk mencegah double checkout
            $transaksi = Transaksi::with('tarif')
                ->where('id_parkir', $idParkir)
                ->lockForUpdate()
                ->firstOrFail();

            // Cegah double update — jika sudah keluar, skip processing
            if ($transaksi->status === 'keluar') {
                Log::info('DOKU: Transaksi sudah diproses, skip.', ['id_parkir' => $idParkir]);
                return (int) $transaksi->biaya_total;
            }

            $waktuKeluar = now();

            // Cek apakah VIP
            $isVip = $transaksiService->isVip($transaksi->plat_nomor);
            $metodePembayaran = $isVip ? 'vip' : 'cashless';

            // KALKULASI via DATABASE (Stored Procedure)
            $waktuKeluarFormat = $waktuKeluar->format('Y-m-d H:i:s');
            DB::statement("CALL proses_checkout(?, ?, ?)", [
                $transaksi->id_parkir,
                $waktuKeluarFormat,
                $karcisHilang ? 1 : 0
            ]);

            // Refresh karena data dimutasi oleh DB
            $transaksi->refresh();
            
            // Override VIP jika diperlukan
            if ($isVip) {
                $transaksi->update(['biaya_total' => 0]);
                $biayaTotal = 0;
            } else {
                $biayaTotal = (int) $transaksi->biaya_total;
            }

            // Update field sisanya yang tidak ditangani prosedur
            $transaksi->update([
                'gate_type' => $gateCode,
                'metode_pembayaran' => $metodePembayaran,
            ]);

            // Catatan: AreaParkir otomatis di-decrement oleh Trigger Database `tr_transaksi_keluar`

            // Catat log aktivitas (hanya jika ada user terautentikasi)
            $logMsg = "Checkout: {$transaksi->plat_nomor} via {$gateCode}";
            $logMsg .= $isVip
                ? ' [VIP - Gratis]'
                : " [Cashless QRIS - Rp " . number_format($biayaTotal) . "]";
            if ($karcisHilang) {
                $logMsg .= ' [KARCIS HILANG]';
            }
            LogAktivitas::catat($logMsg);

            Log::info('DOKU: Pembayaran dikonfirmasi', [
                'id_parkir' => $idParkir,
                'biaya' => $biayaTotal,
                'gate' => $gateCode,
                'karcis_hilang' => $karcisHilang,
            ]);

            return $biayaTotal;
        });
    }

    /**
     * Validasi signature webhook yang dikirim oleh DOKU.
     * DOKU menandatangani notification menggunakan symmetric signature (HMAC-SHA512).
     *
     * @param Request $request Incoming webhook request dari DOKU
     * @return bool True jika signature valid
     */
    public function validateWebhook(Request $request): bool
    {
        try {
            $signature = $request->header('X-SIGNATURE');
            $timestamp = $request->header('X-TIMESTAMP');
            $clientId = $request->header('X-PARTNER-ID') ?? $request->header('X-CLIENT-KEY');

            // Pastikan header yang dibutuhkan ada
            if (!$signature || !$timestamp) {
                Log::warning('DOKU Webhook: Missing signature or timestamp header');
                return false;
            }

            // Reconstruct string to sign sesuai SNAP BI standard (symmetric)
            $body = $request->getContent();
            $httpMethod = 'POST';
            $endpointUrl = '/webhook/doku/payment';

            // String to sign: HTTPMethod + ":" + EndpointUrl + ":" + AccessToken + ":" + SHA256(Body) + ":" + Timestamp
            // Untuk notification, AccessToken dikosongkan
            $bodyHash = strtolower(hash('sha256', $body));
            $stringToSign = $httpMethod . ':' . $endpointUrl . ':' . ':' . $bodyHash . ':' . $timestamp;

            // Hitung HMAC-SHA512 menggunakan secret key merchant
            $expectedSignature = base64_encode(
                hash_hmac('sha512', $stringToSign, $this->secretKey, true)
            );

            // Bandingkan signature secara time-safe
            return hash_equals($expectedSignature, $signature);
        } catch (\Exception $e) {
            Log::error('DOKU Webhook Validation Error: ' . $e->getMessage());
            return false;
        }
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    /**
     * Panggil DOKU API dengan token dan signature yang benar.
     * Menghandle B2B access token (cached 14 menit) + symmetric service signature.
     *
     * @param string $method HTTP method (POST)
     * @param string $endpoint API endpoint path
     * @param array $body Request body
     * @return \Illuminate\Http\Client\Response
     */
    private function callDokuApi(string $method, string $endpoint, array $body): \Illuminate\Http\Client\Response
    {
        // Dapatkan access token (cached selama 14 menit)
        $accessToken = $this->getAccessToken();

        // Buat timestamp WIB (ISO 8601 dengan timezone +07:00)
        $timestamp = now()->setTimezone('+07:00')->format('Y-m-d\TH:i:sP');

        // Buat symmetric signature untuk service request
        $signature = $this->createServiceSignature($method, $endpoint, $accessToken, $body, $timestamp);

        // Unique external ID per request (mencegah duplicate processing di sisi DOKU)
        $externalId = uniqid('EXT-', true);

        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $accessToken,
            'X-TIMESTAMP' => $timestamp,
            'X-SIGNATURE' => $signature,
            'X-PARTNER-ID' => $this->clientId,
            'X-EXTERNAL-ID' => $externalId,
            'CHANNEL-ID' => 'H2H',
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . $endpoint, $body);
    }

    /**
     * Dapatkan B2B access token dari DOKU.
     * Token di-cache selama 14 menit (token berlaku 15 menit).
     *
     * Alur: Buat signature RSA → POST ke /authorization/v1/access-token/b2b → dapat accessToken
     *
     * @return string Access token
     * @throws \Exception Jika gagal mendapatkan token
     */
    private function getAccessToken(): string
    {
        return Cache::remember('doku_b2b_access_token', 840, function () {
            // Timestamp WIB untuk request token
            $timestamp = now()->setTimezone('+07:00')->format('Y-m-d\TH:i:sP');

            // Buat asymmetric signature (SHA256withRSA)
            // StringToSign = clientId + "|" + timestamp
            $stringToSign = $this->clientId . '|' . $timestamp;

            // Load private key RSA
            $privateKey = openssl_pkey_get_private($this->privateKey);
            if (!$privateKey) {
                $error = openssl_error_string();
                Log::error('DOKU: Private key RSA tidak valid', ['error' => $error]);
                throw new \Exception('DOKU: Private key RSA tidak valid - ' . $error);
            }

            // Sign string to sign menggunakan RSA SHA-256
            openssl_sign($stringToSign, $signature, $privateKey, OPENSSL_ALGO_SHA256);
            $signatureBase64 = base64_encode($signature);

            // Request token ke DOKU
            $response = Http::withHeaders([
                'X-TIMESTAMP' => $timestamp,
                'X-CLIENT-KEY' => $this->clientId,
                'X-SIGNATURE' => $signatureBase64,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/authorization/v1/access-token/b2b', [
                'grantType' => 'client_credentials',
            ]);

            $data = $response->json();

            // Validasi response — pastikan ada accessToken
            if (!$response->successful() || empty($data['accessToken'])) {
                Log::error('DOKU Token Error', [
                    'status' => $response->status(),
                    'response' => $data,
                ]);
                throw new \Exception(
                    'Gagal mendapatkan token DOKU: ' . ($data['responseMessage'] ?? 'Unknown error')
                );
            }

            Log::info('DOKU: B2B Access Token berhasil didapatkan');
            return $data['accessToken'];
        });
    }

    /**
     * Buat symmetric signature (HMAC-SHA512) untuk B2B service request.
     * Sesuai standar SNAP BI Bank Indonesia.
     *
     * StringToSign = HTTPMethod + ":" + EndpointUrl + ":" + AccessToken + ":" + SHA256(Body) + ":" + Timestamp
     *
     * @param string $method HTTP method
     * @param string $endpoint API endpoint
     * @param string $accessToken B2B access token
     * @param array $body Request body
     * @param string $timestamp ISO 8601 timestamp
     * @return string Base64-encoded HMAC-SHA512 signature
     */
    private function createServiceSignature(
        string $method,
        string $endpoint,
        string $accessToken,
        array $body,
        string $timestamp
    ): string {
        // JSON encode body lalu hash dengan SHA-256 (lowercase hex)
        $bodyJson = json_encode($body);
        $bodyHash = strtolower(hash('sha256', $bodyJson));

        // Compose string to sign sesuai SNAP BI standard
        $stringToSign = $method . ':' . $endpoint . ':' . $accessToken . ':' . $bodyHash . ':' . $timestamp;

        // HMAC-SHA512 menggunakan secret key (binary output)
        $signature = hash_hmac('sha512', $stringToSign, $this->secretKey, true);

        return base64_encode($signature);
    }
}

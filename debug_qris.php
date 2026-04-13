<?php
// Debug QRIS v2 — test dengan fix additionalInfo + CHANNEL-ID + merchantId
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$clientId = $_ENV['DOKU_CLIENT_ID'] ?? '';
$secretKey = $_ENV['DOKU_SECRET_KEY'] ?? '';
$privateKey = $_ENV['DOKU_PRIVATE_KEY'] ?? '';
$merchantId = $_ENV['DOKU_MERCHANT_ID'] ?? '';
$baseUrl = 'https://api-sandbox.doku.com';

echo "Client ID: " . substr($clientId, 0, 15) . "...\n";
echo "Merchant ID: $merchantId\n";
echo "Secret Key: " . substr($secretKey, 0, 12) . "...\n\n";

// === Step 1: Get B2B Access Token ===
$timestamp = (new DateTime('now', new DateTimeZone('+07:00')))->format('Y-m-d\TH:i:sP');
$stringToSign = $clientId . '|' . $timestamp;

$pk = openssl_pkey_get_private($privateKey);
if (!$pk) { die("ERROR: Private key invalid\n"); }

openssl_sign($stringToSign, $sig, $pk, OPENSSL_ALGO_SHA256);
$sigB64 = base64_encode($sig);

echo "=== Step 1: Getting Access Token ===\n";
$ch = curl_init($baseUrl . '/authorization/v1/access-token/b2b');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'X-TIMESTAMP: ' . $timestamp,
        'X-CLIENT-KEY: ' . $clientId,
        'X-SIGNATURE: ' . $sigB64,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode(['grantType' => 'client_credentials']),
]);
$tokenResp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$tokenData = json_decode($tokenResp, true);
$accessToken = $tokenData['accessToken'] ?? null;

if (!$accessToken) {
    echo "FAILED ($httpCode): $tokenResp\n";
    exit(1);
}
echo "OK ($httpCode) - Token: " . substr($accessToken, 0, 30) . "...\n\n";

// === Step 2: Generate QRIS ===
$refNo = 'PKR99' . date('YmdHis');  // Alphanumeric reference
$validityPeriod = (new DateTime('+5 minutes', new DateTimeZone('+07:00')))->format('Y-m-d\TH:i:sP');

$body = [
    'partnerReferenceNo' => $refNo,
    'amount' => [
        'value' => '22000.00',
        'currency' => 'IDR',
    ],
    'merchantId' => $merchantId,
    'terminalId' => 'GATEOUT3',
    'validityPeriod' => $validityPeriod,
    'additionalInfo' => [
        'isStatic' => false,
    ],
];

$bodyJson = json_encode($body);
echo "=== Step 2: Generate QRIS ===\n";
echo "Body: $bodyJson\n\n";

$endpoint = '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate';
$timestamp2 = (new DateTime('now', new DateTimeZone('+07:00')))->format('Y-m-d\TH:i:sP');

// Symmetric signature (HMAC-SHA512)
$bodyHash = strtolower(hash('sha256', $bodyJson));
$stsStr = 'POST:' . $endpoint . ':' . $accessToken . ':' . $bodyHash . ':' . $timestamp2;
$signature = base64_encode(hash_hmac('sha512', $stsStr, $secretKey, true));

$externalId = 'EXT' . date('YmdHis') . rand(100, 999);

$headers = [
    'Authorization: Bearer ' . $accessToken,
    'X-TIMESTAMP: ' . $timestamp2,
    'X-SIGNATURE: ' . $signature,
    'X-PARTNER-ID: ' . $clientId,
    'X-EXTERNAL-ID: ' . $externalId,
    'CHANNEL-ID: H2H',
    'Content-Type: application/json',
];

echo "Headers:\n";
foreach ($headers as $h) {
    $parts = explode(':', $h, 2);
    $name = trim($parts[0]);
    $val = trim($parts[1] ?? '');
    // Truncate long values
    if (strlen($val) > 40) $val = substr($val, 0, 40) . '...';
    echo "  $name: $val\n";
}
echo "\n";

$ch2 = curl_init($baseUrl . $endpoint);
curl_setopt_array($ch2, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_POSTFIELDS => $bodyJson,
]);
$qrisResp = curl_exec($ch2);
$httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);

echo "Response ($httpCode2):\n$qrisResp\n\n";

$data = json_decode($qrisResp, true);
if (!empty($data['qrContent'])) {
    echo "SUCCESS! QR Content: " . substr($data['qrContent'], 0, 60) . "...\n";
    echo "Reference: " . ($data['referenceNo'] ?? 'N/A') . "\n";
} else {
    echo "FAILED: " . ($data['responseMessage'] ?? 'Unknown error') . "\n";
    echo "Code: " . ($data['responseCode'] ?? 'N/A') . "\n";
}

/**
 * Cloudinary Utility — Upload foto kendaraan dari frontend.
 *
 * Upload dilakukan LANGSUNG ke Cloudinary (unsigned preset)
 * agar tidak membebani server Laravel.
 *
 * Konfigurasi diambil dari environment variables Vite:
 * - VITE_CLOUDINARY_CLOUD_NAME
 * - VITE_CLOUDINARY_UPLOAD_PRESET
 *
 * PENTING: Pastikan Vite di-restart setelah mengubah .env
 */

// Ambil konfigurasi dari environment Vite
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Log konfigurasi saat module dimuat (untuk debugging)
console.log('[Cloudinary] Cloud Name:', CLOUD_NAME || 'TIDAK TERBACA!');
console.log('[Cloudinary] Upload Preset:', UPLOAD_PRESET || 'TIDAK TERBACA!');

/**
 * Cek apakah konfigurasi Cloudinary sudah lengkap.
 * Dipanggil sebelum upload untuk memberikan pesan error yang jelas.
 *
 * @returns {{ valid: boolean, message: string }}
 */
function validateConfig() {
    if (!CLOUD_NAME) {
        return {
            valid: false,
            message: 'VITE_CLOUDINARY_CLOUD_NAME kosong di .env. Pastikan sudah diisi dan restart Vite (npm run dev).',
        };
    }
    if (!UPLOAD_PRESET) {
        return {
            valid: false,
            message: 'VITE_CLOUDINARY_UPLOAD_PRESET kosong di .env. Pastikan sudah diisi dan restart Vite (npm run dev).',
        };
    }
    return { valid: true, message: 'OK' };
}

/**
 * Capture satu frame dari elemen <video>, resize dan kompres ke JPEG.
 *
 * @param {HTMLVideoElement} videoElement - Elemen video yang sedang streaming
 * @param {number} maxWidth - Lebar maksimal output (default 800px)
 * @param {number} maxHeight - Tinggi maksimal output (default 600px)
 * @param {number} quality - Kualitas JPEG 0-1 (default 0.8 = 80%)
 * @returns {Promise<Blob>} Blob JPEG siap upload
 */
export function captureFrame(videoElement, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        try {
            if (!videoElement) {
                reject(new Error('Video element null atau undefined.'));
                return;
            }

            // Tunggu video siap — cek dimensi video
            if (!videoElement.videoWidth || videoElement.videoWidth === 0) {
                reject(new Error('Video belum siap (videoWidth=0). Pastikan kamera sudah streaming.'));
                return;
            }

            if (videoElement.readyState < 2) {
                // readyState < HAVE_CURRENT_DATA — belum ada frame data
                reject(new Error(`Video readyState=${videoElement.readyState}, belum cukup untuk capture.`));
                return;
            }

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Gagal membuat canvas 2D context.'));
                return;
            }

            // Hitung dimensi output dengan menjaga aspect ratio
            const videoW = videoElement.videoWidth;
            const videoH = videoElement.videoHeight;
            const scale = Math.min(maxWidth / videoW, maxHeight / videoH, 1);

            canvas.width = Math.round(videoW * scale);
            canvas.height = Math.round(videoH * scale);

            console.log(`[Cloudinary] Capture frame: ${canvas.width}x${canvas.height} (video: ${videoW}x${videoH})`);

            // Gambar frame video ke canvas (sudah di-resize)
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Konversi ke JPEG blob dengan kompresi
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        console.log(`[Cloudinary] Frame captured: ${(blob.size / 1024).toFixed(1)} KB`);
                        resolve(blob);
                    } else {
                        reject(new Error('canvas.toBlob() mengembalikan null — browser mungkin tidak mendukung JPEG encoding.'));
                    }
                },
                'image/jpeg',
                quality
            );
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Upload foto (Blob) ke Cloudinary menggunakan unsigned upload preset.
 *
 * @param {Blob} blob - File foto (hasil captureFrame)
 * @param {string} folder - Folder tujuan di Cloudinary (contoh: 'hermina_parking/masuk')
 * @param {string} publicId - Nama file custom (opsional, contoh: '123_1711871234')
 * @returns {Promise<string>} URL publik foto yang ter-upload (secure_url)
 */
export async function uploadToCloudinary(blob, folder = 'hermina_parking/gates', publicId = null) {
    // Validasi konfigurasi sebelum upload
    const config = validateConfig();
    if (!config.valid) {
        console.error('[Cloudinary] Konfigurasi tidak valid:', config.message);
        throw new Error(config.message);
    }

    // Bangun URL upload — format: https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    console.log('[Cloudinary] Upload URL:', uploadUrl);
    console.log('[Cloudinary] Preset:', UPLOAD_PRESET, '| Folder:', folder);

    const formData = new FormData();
    formData.append('file', blob, 'capture.jpg');
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    // Set nama file custom jika diberikan
    if (publicId) {
        formData.append('public_id', publicId);
    }

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        // Ambil response body untuk debugging
        const responseText = await response.text();
        console.log('[Cloudinary] Response status:', response.status);

        if (!response.ok) {
            // Parse error detail dari Cloudinary
            let errorDetail = '';
            try {
                const errorData = JSON.parse(responseText);
                errorDetail = errorData?.error?.message || responseText;
            } catch {
                errorDetail = responseText;
            }

            console.error('[Cloudinary] Upload GAGAL:', {
                status: response.status,
                statusText: response.statusText,
                detail: errorDetail,
                url: uploadUrl,
                preset: UPLOAD_PRESET,
            });

            // Berikan pesan error yang informatif berdasarkan status code
            if (response.status === 400) {
                throw new Error(
                    `Cloudinary 400 Bad Request — Upload preset "${UPLOAD_PRESET}" mungkin belum dibuat ` +
                    `atau belum di-set sebagai UNSIGNED di Cloudinary Dashboard. Detail: ${errorDetail}`
                );
            }
            if (response.status === 401) {
                throw new Error('Cloudinary 401 Unauthorized — Cloud name atau credentials salah.');
            }

            throw new Error(`Upload gagal (HTTP ${response.status}): ${errorDetail}`);
        }

        // Sukses — parse JSON dan ambil secure_url
        const data = JSON.parse(responseText);
        console.log('[Cloudinary] Upload SUKSES:', data.secure_url);
        return data.secure_url; // URL ini yang disimpan ke database
    } catch (err) {
        // Re-throw error yang sudah kita buat, tambahkan context jika error jaringan
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            throw new Error('Gagal terhubung ke Cloudinary — periksa koneksi internet.');
        }
        throw err;
    }
}

/**
 * Shortcut: Capture frame + upload ke Cloudinary dalam satu langkah.
 *
 * @param {HTMLVideoElement} videoElement - Elemen video aktif
 * @param {string} folder - Folder tujuan ('hermina_parking/masuk' atau 'hermina_parking/keluar')
 * @param {string} publicId - Nama file custom (opsional)
 * @returns {Promise<string>} URL Cloudinary
 */
export async function captureAndUpload(videoElement, folder, publicId = null) {
    console.log('[Cloudinary] captureAndUpload dimulai...', { folder, publicId });

    // Step 1: Capture frame dari video
    const blob = await captureFrame(videoElement);

    // Step 2: Upload ke Cloudinary
    const url = await uploadToCloudinary(blob, folder, publicId);

    return url;
}

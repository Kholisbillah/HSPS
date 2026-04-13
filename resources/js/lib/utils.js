import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility helper untuk menggabungkan Tailwind CSS classes
 * Menghindari duplikasi definisi cn() di setiap file
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format angka ke mata uang Rupiah Indonesia
 * Contoh: 5000 -> "Rp5.000"
 */
export function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number || 0);
}

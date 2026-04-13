/**
 * OccupancyGauge — SVG Circular Donut Gauge
 * Menampilkan persentase okupansi area parkir dalam bentuk donut chart.
 * Warna berubah dinamis berdasarkan level:
 *  - Emerald (< 70%)  → Area masih longgar
 *  - Amber   (70-90%) → Area mulai penuh
 *  - Red     (> 90%)  → Area hampir/penuh
 */
export default function OccupancyGauge({ percentage = 0, size = 100, strokeWidth = 10 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    // Hitung panjang stroke yang terisi (dashoffset)
    const offset = circumference - (percentage / 100) * circumference;

    // Warna dinamis berdasarkan level okupansi
    const getColor = (pct) => {
        if (pct >= 100) return { stroke: '#dc2626', text: '#dc2626', bg: '#fef2f2' };    // Full → Merah
        if (pct > 90) return { stroke: '#ef4444', text: '#ef4444', bg: '#fef2f2' };     // Kritis → Merah muda
        if (pct > 70) return { stroke: '#f59e0b', text: '#d97706', bg: '#fffbeb' };     // Mengisi → Kuning
        return { stroke: '#10b981', text: '#059669', bg: '#ecfdf5' };                     // Aman → Hijau
    };

    const colors = getColor(percentage);

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle (track) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                />
                {/* Foreground circle (progress) — animasi CSS transition */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            {/* Label persentase di tengah donut */}
            <div className="absolute flex flex-col items-center justify-center">
                <span
                    className="font-mono font-black text-lg leading-none"
                    style={{ color: colors.text }}
                >
                    {percentage}%
                </span>
            </div>
        </div>
    );
}

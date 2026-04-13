import { motion } from 'framer-motion';
import { Car, Bike, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * ParkingSlotGrid — Visualisasi top-down slot parkir.
 * Menampilkan grid kotak yang merepresentasikan setiap slot.
 *  - Slot TERISI = kotak gelap dengan ikon kendaraan
 *  - Slot KOSONG = kotak hijau muda
 *
 * Props:
 *  - kapasitas: total slot
 *  - terisi: jumlah terisi
 *  - peruntukan: 'motor' | 'mobil' | 'semua'
 */
export default function ParkingSlotGrid({ kapasitas, terisi, peruntukan }) {
    // Hitung jumlah kolom grid secara responsif
    const getColumns = () => {
        if (kapasitas <= 10) return kapasitas;
        if (kapasitas <= 30) return 10;
        if (kapasitas <= 100) return 15;
        return 20;
    };
    const columns = getColumns();

    // Ikon kendaraan berdasarkan peruntukan area
    const VehicleIcon = peruntukan === 'motor' ? Bike : peruntukan === 'mobil' ? Car : Truck;

    // Buat array slot: terisi di depan (occupied=true), kosong di belakang
    const slots = Array.from({ length: kapasitas }, (_, i) => ({
        id: i,
        occupied: i < terisi,
    }));

    // Animasi container stagger
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.005 }
        }
    };

    const slotVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="w-full">
            {/* Grid Container */}
            <motion.div
                className="grid gap-1.5 md:gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                variants={containerVariants}
                initial="hidden"
                animate="show"
                key={`${kapasitas}-${terisi}`} // Re-animate saat data berubah
            >
                {slots.map((slot) => (
                    <motion.div
                        key={slot.id}
                        variants={slotVariants}
                        className={cn(
                            "aspect-[3/2] rounded-lg flex items-center justify-center transition-all duration-300 border",
                            slot.occupied
                                ? "bg-slate-700 border-slate-600 shadow-inner"
                                : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm"
                        )}
                        title={slot.occupied ? `Slot ${slot.id + 1} — Terisi` : `Slot ${slot.id + 1} — Kosong`}
                    >
                        {slot.occupied ? (
                            <VehicleIcon className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                        ) : (
                            <span className="text-[8px] md:text-[10px] font-mono text-emerald-300 font-bold select-none">
                                {slot.id + 1}
                            </span>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-slate-700 border border-slate-600"></div>
                    <span>Terisi ({terisi})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-emerald-50 border border-emerald-200"></div>
                    <span>Kosong ({kapasitas - terisi})</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <VehicleIcon className="w-2 h-2 text-slate-400" />
                    </div>
                    <span className="capitalize">{peruntukan}</span>
                </div>
            </div>
        </div>
    );
}

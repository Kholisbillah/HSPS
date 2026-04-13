import React, { lazy, Suspense } from 'react';

// Lazy load Barcode agar tidak memblokir render modal
const Barcode = lazy(() => import('react-barcode'));

export const ParkingTicket = React.forwardRef(({ transaction }, ref) => {
    if (!transaction) return null;

    // Format tarif dari database (bukan hardcoded)
    const formatRupiah = (val) =>
        val ? `Rp ${new Intl.NumberFormat('id-ID').format(val)}` : '-';

    return (
        <div ref={ref} className="p-4 bg-white text-black font-mono border border-gray-300 mx-auto" style={{ width: '300px', minHeight: '400px' }}>
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-dashed border-black pb-4">
                <div className="flex justify-center mb-2">
                    <img src="/images/hermina_logo.png" alt="Logo" className="h-16 grayscale filter" />
                </div>
                <h3 className="font-bold text-lg uppercase leading-tight">HERMINA SMART PARKING</h3>
                <p className="text-[10px] mt-1 px-4 leading-tight">Jl. A.H. Nasution No. 50, Antapani Wetan, Kec. Antapani, Kota Bandung</p>
            </div>

            {/* Body */}
            <div className="mb-4 space-y-2">
                <div className="text-center">
                    <p className="text-xs uppercase text-gray-500">Nomor Plat</p>
                    <h1 className="text-4xl font-black uppercase my-1 tracking-wider">{transaction.plat_nomor}</h1>
                </div>

                <div className="flex justify-between text-xs font-bold border-t border-b border-black py-2 mt-2">
                    <span>JENIS</span>
                    <span className="uppercase">{transaction.jenis_kendaraan || 'KENDARAAN'}</span>
                </div>

                <div className="text-xs space-y-1 mt-2">
                    <div className="flex justify-between">
                        <span>MASUK:</span>
                        <span>{new Date(transaction.waktu_masuk).toLocaleString('id-ID')}</span>
                    </div>
                </div>

                {/* Tarif Info — dinamis dari database */}
                <div className="mt-4 border-t border-dashed border-black pt-2">
                    <p className="text-[10px] font-bold text-center mb-1">Tarif ({(transaction.jenis_kendaraan || 'UMUM').toUpperCase()})</p>
                    <div className="text-[10px] flex justify-between px-2">
                        <span>Per Jam</span>
                        <span>{formatRupiah(transaction.tarif_per_jam)}</span>
                    </div>
                    <p className="text-[9px] text-center mt-1 italic text-gray-500">*Tarif maksimum per 24 jam berlaku.</p>
                </div>
            </div>

            {/* Footer / Barcode — Lazy loaded */}
            <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-black">
                <p className="text-xs mb-2">Simpan tiket ini. Denda tiket hilang Rp 50.000</p>
                <div className="flex justify-center">
                    <Suspense fallback={<div className="text-xs text-gray-400 py-4">Memuat barcode...</div>}>
                        <Barcode
                            value={transaction.plat_nomor}
                            width={2}
                            height={60}
                            fontSize={14}
                            displayValue={true}
                        />
                    </Suspense>
                </div>
                <p className="text-[10px] mt-2 text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
});

ParkingTicket.displayName = 'ParkingTicket';

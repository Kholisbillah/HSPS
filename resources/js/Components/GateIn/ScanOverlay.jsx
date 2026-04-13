import React from 'react';

export default function ScanOverlay() {
    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-64 border-2 border-emerald-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            {/* Scanning Line */}
            <div className="w-full h-1 bg-emerald-500/50 shadow-[0_0_20px_#10b981] animate-scan-y absolute top-0"></div>

            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>

            {/* Center Crosshair */}
            <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-emerald-500/50 -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
        </div>
    );
}

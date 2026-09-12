import React from 'react';
import { Wrench, RefreshCw } from 'lucide-react'; // Optional: npm install lucide-react

export default function MaintenanceNotice({ onRetry }) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center text-center px-4 py-12 my-6 bg-gradient-to-b from-[#121318]/60 to-[#0b0c0f]/80 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm">
      {/* Icon Badge */}
      <div className="relative mb-6">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-500 to-red-600 opacity-25 blur-sm animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-[#181920] border border-white/10 flex items-center justify-center text-orange-500 shadow-inner">
          <Wrench className="w-8 h-8 stroke-[1.75]" />
        </div>
      </div>

      {/* Main Content */}
      <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
        System Under Maintenance
      </h2>
      
      <p className="max-w-md text-gray-400 text-sm md:text-base leading-relaxed mb-8">
        AniArix is currently undergoing scheduled enhancements to improve performance. We’ll be back online shortly!
      </p>

      {/* Action Controls */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      )}
    </div>
  );
}
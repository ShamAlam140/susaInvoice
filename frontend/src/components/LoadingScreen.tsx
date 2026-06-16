import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/70 z-50">
      <div className="relative flex flex-col items-center">
        {/* Animated outer glowing ring */}
        <div className="absolute w-24 h-24 rounded-full border-4 border-indigo-500/10 animate-ping duration-1000" />
        
        {/* Spinner container */}
        <div className="relative bg-white p-6 rounded-3xl shadow-2xl border border-slate-100/50 flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-300">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
        
        {/* Loading text with slide-up fade-in style */}
        <h3 className="text-slate-800 font-extrabold text-lg tracking-tight animate-pulse">
          Susa Invoice
        </h3>
        <p className="text-slate-500 text-xs mt-1 font-medium tracking-wide">
          Loading portal assets...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;

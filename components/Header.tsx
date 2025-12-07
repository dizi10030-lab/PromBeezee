import React from 'react';
import { ShieldCheck, HardHat } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
             <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PromBez Expert AI</h1>
            <p className="text-xs text-slate-400">Ассистент промышленной безопасности (ФНП)</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
          <HardHat className="w-4 h-4" />
          <span>Gemini 2.5 Flash Powered</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';
import { ShieldCheck, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const SafetyModal: React.FC<SafetyModalProps> = ({ isOpen, onClose, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 border transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/20 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold">PLAYAPK Safety & Security</h3>
            <p className="text-xs text-slate-400">Our commitment to safe sharing & downloading</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Strict File Verification</h4>
              <p className="text-xs text-slate-400">Only verified Android Package files (.apk) are accepted by our upload parser and scanner.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-white">Uploader Responsibility</h4>
              <p className="text-xs text-slate-400">Users are fully responsible for the APK files they upload. Ensure your apps comply with safety standards and do not contain malicious code.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs">
            <span className="font-bold">Tip for Downloaders:</span> Always review permissions and release notes before installing any APK on your device. Use developer version history to track updates.
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

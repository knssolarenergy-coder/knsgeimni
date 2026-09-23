import React, { useState } from 'react';
import { Smartphone, Download, Share2, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstalledSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-stone-950 p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shadow-lg">
              <Smartphone className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-stone-950 leading-tight">
                Install Mobile App
              </h3>
              <p className="text-xs font-semibold text-stone-900/80">
                K&amp;S Solar Energy on Android &amp; iPhone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-950/70 hover:text-stone-950 hover:bg-black/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-sm text-stone-700">
          <div className="flex items-center gap-3 bg-amber-50 p-3.5 rounded-xl border border-amber-200/80 text-amber-950">
            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-xs leading-relaxed font-medium">
              Yeh app direct aapke phone ki home screen par <strong>Native Mobile App</strong> ki tarah install hoti hai — baghair Play Store ke.
            </p>
          </div>

          {/* Android Flow */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-3 bg-stone-50/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Android / Chrome
              </span>
              {isInstallable && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  Ready to Install
                </span>
              )}
            </div>

            {isInstallable ? (
              <button
                id="pwa-native-install-button"
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold shadow-md hover:shadow-lg transition-all"
              >
                {installedSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span>App Installed!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download / Install App</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-xs text-stone-600 leading-relaxed">
                Browser ke top right corner mein <strong>three dots (⋮)</strong> par click karein aur <strong>&quot;Install app&quot;</strong> ya <strong>&quot;Add to Home screen&quot;</strong> choose karein.
              </p>
            )}
          </div>

          {/* iPhone / iOS Flow */}
          <div className="rounded-xl border border-stone-200 p-4 space-y-2 bg-stone-50/50">
            <span className="font-bold text-stone-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Apple iPhone / iPad (Safari)
            </span>
            <div className="text-xs text-stone-600 space-y-1.5 pl-8">
              <p className="flex items-center gap-1.5">
                • Safari browser ke bottom toolbar mein <strong>Share</strong> (<Share2 className="w-3.5 h-3.5 inline text-blue-600" />) icon dabayein.
              </p>
              <p>
                • Niche scroll karke <strong>&quot;Add to Home Screen&quot;</strong> select karein.
              </p>
              <p>
                • Top-right mein <strong>&quot;Add&quot;</strong> dabayein. K&amp;S Solar Energy icon aapke phone par show ho jayega!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-950 transition"
          >
            Theek hai, Samajh Gaya
          </button>
        </div>
      </div>
    </div>
  );
};

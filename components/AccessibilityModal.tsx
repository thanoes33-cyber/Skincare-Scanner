
import React, { useEffect } from 'react';
import { useAccessibility, TextSize } from '../contexts/AccessibilityContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const { 
    textSize, highContrast, reducedMotion, soundEnabled, 
    updateSetting, playClick 
  } = useAccessibility();

  useEffect(() => {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      if(isOpen) window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-labelledby="a11y-title"
        aria-modal="true"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 id="a11y-title" className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Accessibility Settings
          </h2>
          <button 
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-8">
            {/* Text Size */}
            <fieldset>
                <legend className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Text Size</legend>
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                    {(['base', 'lg', 'xl', '2xl'] as TextSize[]).map((size) => (
                        <button
                            key={size}
                            onClick={() => { updateSetting('textSize', size); playClick(); }}
                            aria-pressed={textSize === size}
                            className={`flex-1 py-3 rounded-md font-bold transition-all ${
                                textSize === size 
                                ? 'bg-brand-green text-white shadow-sm' 
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            <span className={size === 'base' ? 'text-sm' : size === 'lg' ? 'text-base' : size === 'xl' ? 'text-lg' : 'text-xl'}>
                                {size === 'base' ? 'Aa' : size === 'lg' ? 'Aa' : size === 'xl' ? 'Aa' : 'Aa'}
                            </span>
                        </button>
                    ))}
                </div>
            </fieldset>

            {/* Toggles */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                        <span className="block font-bold text-gray-900 dark:text-white">High Contrast</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Enhance borders and colors</span>
                    </div>
                    <button
                        onClick={() => { updateSetting('highContrast', !highContrast); playClick(); }}
                        aria-checked={highContrast}
                        role="switch"
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
                            highContrast ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            highContrast ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                        <span className="block font-bold text-gray-900 dark:text-white">Reduced Motion</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Minimize animations</span>
                    </div>
                    <button
                        onClick={() => { updateSetting('reducedMotion', !reducedMotion); playClick(); }}
                        aria-checked={reducedMotion}
                        role="switch"
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
                            reducedMotion ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            reducedMotion ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div>
                        <span className="block font-bold text-gray-900 dark:text-white">Sound Effects</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Play audio cues for actions</span>
                    </div>
                    <button
                        onClick={() => { updateSetting('soundEnabled', !soundEnabled); }}
                        aria-checked={soundEnabled}
                        role="switch"
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${
                            soundEnabled ? 'bg-brand-green' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    >
                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            soundEnabled ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>
        </div>

        <div className="mt-8">
            <button
                onClick={onClose}
                className="w-full py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-dark transition-colors focus:outline-none focus:ring-4 focus:ring-brand-green/30"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

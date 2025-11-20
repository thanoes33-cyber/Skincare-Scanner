
import React, { useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { LeafIcon } from './icons/LeafIcon';

interface ProductSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selections: string[];
    onSelect: (productName: string) => void;
    query: string;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ isOpen, onClose, selections, onSelect, query }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select a Product</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Results for <span className="font-medium text-brand-green">"{query}"</span>
                </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400">
                <XMarkIcon className="w-6 h-6" />
            </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar p-3">
            {selections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p>No products found. Please try a specific name.</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {selections.map((item, index) => (
                        <li key={index}>
                            <button
                                onClick={() => onSelect(item)}
                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-brand-green/5 dark:hover:bg-brand-green/10 border border-transparent hover:border-brand-green/30 transition-all group flex items-center"
                            >
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-3 group-hover:bg-brand-green/20 transition-colors">
                                    <LeafIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-brand-green" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-green-dark dark:group-hover:text-brand-green-light">
                                    {item}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 text-center">
             <button 
                onClick={() => onSelect(query)}
                className="text-sm text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light font-medium flex items-center justify-center w-full"
             >
                <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                Analyze "{query}" directly instead
             </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; }
      `}</style>
    </div>
  );
};

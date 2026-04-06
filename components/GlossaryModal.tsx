
import React, { useEffect } from 'react';
import type { GlossaryEntry } from '../types';
import { Spinner } from './Spinner';
import { XMarkIcon } from './icons/XMarkIcon';
import { LeafIcon } from './icons/LeafIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface GlossaryModalProps {
  ingredientName: string;
  entry: GlossaryEntry | null;
  isLoading: boolean;
  error: string;
  onClose: () => void;
}

const GlossarySection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <div className="flex items-center mb-2">
            {icon}
            <h4 className="text-md font-bold text-brand-gray-dark dark:text-white ml-2">{title}</h4>
        </div>
        <p className="text-sm text-brand-gray dark:text-gray-300 leading-relaxed">{children}</p>
    </div>
);


export const GlossaryModal: React.FC<GlossaryModalProps> = ({ ingredientName, entry, isLoading, error, onClose }) => {
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative animate-slide-up transition-colors duration-200"
        onClick={e => e.stopPropagation()}
       >
        <button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green"
            aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 id="glossary-title" className="text-2xl font-bold text-brand-green-dark dark:text-brand-green mb-4 capitalize pr-8">{ingredientName}</h2>
        
        {isLoading && (
            <div className="flex items-center justify-center py-10">
                <Spinner className="text-brand-green" />
                <span className="text-brand-gray-dark dark:text-gray-300 ml-2">Fetching details...</span>
            </div>
        )}

        {error && (
             <div className="text-center py-10">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-600 dark:text-red-400 font-semibold">Could not load details</p>
                <p className="text-sm text-red-500 dark:text-red-300">{error}</p>
            </div>
        )}

        {entry && (
          <div className="space-y-5">
            <GlossarySection title="Common Uses" icon={<LeafIcon className="h-5 w-5 text-purple-500" />}>
                {entry.commonUses}
            </GlossarySection>
            <GlossarySection title="Potential Benefits" icon={<CheckCircleIcon className="h-5 w-5 text-green-500" />}>
                {entry.potentialBenefits}
            </GlossarySection>
             <GlossarySection title="Possible Reactions" icon={<ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />}>
                {entry.possibleReactions}
            </GlossarySection>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

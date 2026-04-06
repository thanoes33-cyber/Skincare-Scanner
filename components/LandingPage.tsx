
import React, { useState } from 'react';
import { LeafIcon } from './icons/LeafIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { AccessibilityIcon } from './icons/AccessibilityIcon';
import { AccessibilityModal } from './AccessibilityModal';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface LandingPageProps {
  onGetStarted: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigateToAbout: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, isDarkMode, toggleTheme, onNavigateToAbout }) => {
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const { playClick } = useAccessibility();

  const handleGetStarted = () => {
    playClick();
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-brand-green-light dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center">
          <LeafIcon className="h-8 w-8 text-brand-green" />
          <span className="ml-2 text-xl font-bold text-brand-green-dark dark:text-brand-green">Skincare Scanner</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => { toggleTheme(); playClick(); }} 
                className="p-2 rounded-full text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-brand-green focus:outline-none"
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
            
            <button 
                onClick={() => { setIsAccessibilityModalOpen(true); playClick(); }}
                className="p-2 rounded-full text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-brand-green focus:outline-none"
                aria-label="Accessibility Settings"
            >
                <AccessibilityIcon className="h-6 w-6" />
            </button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm text-brand-green-dark dark:text-brand-green-light text-sm font-medium mb-4">
            <SparklesIcon className="h-4 w-4 mr-2" />
            <span>AI-Powered Ingredient Analysis</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold text-brand-gray-dark dark:text-white tracking-tight leading-tight">
            Know exactly what touches your <span className="text-brand-green">skin</span>.
          </h1>
          
          <p className="text-xl text-brand-gray dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Scan produce and skincare products to instantly break down ingredients, nutrients, and understand how they affect your unique skin profile.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-brand-green text-white text-lg font-bold rounded-xl shadow-lg hover:bg-brand-green-dark transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-brand-green/50 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl w-full text-left">
          {[
            { title: 'Scan', desc: 'Use your camera to scan barcodes or products instantly.' },
            { title: 'Analyze', desc: 'Get detailed breakdowns of ingredients and nutrients.' },
            { title: 'Personalize', desc: 'See how products match your specific skin type and concerns.' }
          ].map((item, i) => (
            <div key={i} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-lg text-brand-green-dark dark:text-brand-green-light mb-2">{item.title}</h3>
              <p className="text-brand-gray dark:text-gray-300">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {isAccessibilityModalOpen && (
        <AccessibilityModal 
            isOpen={isAccessibilityModalOpen} 
            onClose={() => setIsAccessibilityModalOpen(false)} 
        />
      )}

      <footer className="p-6 text-center text-brand-gray dark:text-gray-500 text-sm flex flex-col items-center gap-2">
        <p>&copy; {new Date().getFullYear()} Skincare Scanner.</p>
        <button 
            onClick={() => { onNavigateToAbout(); playClick(); }}
            className="text-brand-green hover:underline underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green rounded px-2"
        >
            About Skincare Scanner
        </button>
      </footer>
    </div>
  );
};


import React from 'react';
import { LeafIcon } from './icons/LeafIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface LandingPageProps {
  onGetStarted: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-brand-green-light dark:bg-gray-900 transition-colors duration-200 flex flex-col">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center">
          <LeafIcon className="h-8 w-8 text-brand-green" />
          <span className="ml-2 text-xl font-bold text-brand-green-dark dark:text-brand-green">Skincare Scanner</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle dark mode"
            >
                {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
            <button 
              onClick={onGetStarted}
              className="text-brand-green-dark dark:text-brand-green-light font-semibold hover:text-brand-green transition-colors"
            >
              Log In
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
              onClick={onGetStarted}
              className="px-8 py-4 bg-brand-green text-white text-lg font-bold rounded-xl shadow-lg hover:bg-brand-green-dark transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
            >
              Get Started
            </button>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-brand-green-dark dark:text-brand-green-light text-lg font-bold rounded-xl shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700"
            >
              Start Tracking
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

      <footer className="p-6 text-center text-brand-gray dark:text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Skincare Scanner.
      </footer>
    </div>
  );
};

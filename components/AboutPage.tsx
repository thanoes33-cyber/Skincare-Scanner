
import React from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { LeafIcon } from './icons/LeafIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="group flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-brand-green mb-8 transition-colors"
        >
          <div className="p-2 rounded-full group-hover:bg-brand-green/10 mr-2 transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </div>
          Back
        </button>

        <div className="text-center mb-12 animate-fade-in">
           <div className="inline-flex items-center justify-center p-3 bg-brand-green/10 rounded-full mb-4">
               <LeafIcon className="w-8 h-8 text-brand-green" />
           </div>
           <h1 className="text-4xl font-extrabold tracking-tight text-brand-gray-dark dark:text-white sm:text-5xl mb-4">
             About Skincare Scanner
           </h1>
           <p className="text-xl text-brand-gray dark:text-gray-300 max-w-2xl mx-auto">
             Your AI-powered companion for smarter, safer skincare choices.
           </p>
        </div>

        <div className="space-y-16 animate-slide-up">
            {/* Mission */}
            <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-4 text-brand-green-dark dark:text-brand-green">Our Mission</h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    We believe that understanding what you put on your skin shouldn't require a chemistry degree. 
                    Skincare Scanner harnesses the power of advanced AI to decode complex ingredient lists, 
                    identify potential irritants based on your unique profile, and help you build a routine that works for 
                    <em>you</em>.
                </p>
            </section>

            {/* Features Grid */}
            <section>
                <h2 className="text-2xl font-bold mb-8 text-center text-brand-gray-dark dark:text-white">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex-shrink-0 mr-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Instant AI Analysis</h3>
                            <p className="text-gray-600 dark:text-gray-400">Scan any product or produce item. Our Gemini-powered AI identifies ingredients and nutrients instantly.</p>
                        </div>
                    </div>

                    <div className="flex p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="flex-shrink-0 mr-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <CheckCircleIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Personalized Matching</h3>
                            <p className="text-gray-600 dark:text-gray-400">Set your skin type and sensitivities. We'll highlight exactly which ingredients might be helpful or harmful for you.</p>
                        </div>
                    </div>

                    <div className="flex p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="flex-shrink-0 mr-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                                <LeafIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Ingredient Glossary</h3>
                            <p className="text-gray-600 dark:text-gray-400">Tap on any ingredient to get a plain-English explanation of its benefits, common uses, and side effects.</p>
                        </div>
                    </div>

                    <div className="flex p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                         <div className="flex-shrink-0 mr-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                <ExclamationTriangleIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-2">Safety & Recall Alerts</h3>
                            <p className="text-gray-600 dark:text-gray-400">We automatically check against recent data to warn you if a product has been subject to safety recalls.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy */}
             <section className="text-center border-t border-gray-200 dark:border-gray-700 pt-10">
                <h3 className="text-lg font-bold mb-3 text-brand-gray-dark dark:text-white">Privacy First</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-sm">
                    Skincare Scanner processes your scans securely. Your personal profile and scan history are stored locally on your device or browser storage to ensure your health data remains private.
                </p>
            </section>
        </div>
      </div>
       <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
          .animate-slide-up { animation: slide-up 0.5s ease-out 0.2s forwards; opacity: 0; }
      `}</style>
    </div>
  );
};

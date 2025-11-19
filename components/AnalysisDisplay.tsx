
import React, { useState } from 'react';
import type { AnalysisResult } from '../types';
import { Spinner } from './Spinner';
import { LeafIcon } from './icons/LeafIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { searchProductWeb } from '../services/geminiService';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ShareModal } from './ShareModal';

interface AnalysisDisplayProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string;
  onViewIngredient: (ingredientName: string) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md transition-colors duration-200">
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="text-lg font-bold text-brand-gray-dark dark:text-white ml-3">{title}</h3>
    </div>
    {children}
  </div>
);


export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, isLoading, error, onViewIngredient }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ text: string; groundingMetadata: any } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleWebSearch = async () => {
      if (!result?.productName) return;
      setIsSearching(true);
      setSearchResult(null);
      setSearchError(null);
      try {
          const data = await searchProductWeb(result.productName);
          setSearchResult(data);
      } catch (e) {
          setSearchError("Failed to search the web.");
      } finally {
          setIsSearching(false);
      }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg h-full min-h-[400px] transition-colors duration-200">
        <Spinner className="text-brand-green-dark dark:text-brand-green" />
        <p className="mt-4 text-brand-gray-dark dark:text-white font-semibold">Analyzing your product...</p>
        <p className="mt-2 text-sm text-brand-gray dark:text-gray-400">This may take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl shadow-lg h-full min-h-[400px] transition-colors duration-200">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-700 dark:text-red-400 font-bold text-lg">Analysis Failed</p>
        <p className="mt-2 text-sm text-red-600 dark:text-red-300 text-center">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg h-full min-h-[400px] text-center transition-colors duration-200">
        <LeafIcon className="h-16 w-16 text-gray-300 dark:text-gray-600" />
        <p className="mt-4 text-brand-gray-dark dark:text-white font-semibold">Your analysis will appear here.</p>
        <p className="mt-2 text-sm text-brand-gray dark:text-gray-400">Scan a product's QR code and click "Analyze" to begin.</p>
      </div>
    );
  }

  const shareData = {
    title: `Skincare Scanner: ${result.productName}`,
    text: `I just analyzed ${result.productName} with Skincare Scanner!\n\nSummary: ${result.skinAnalysis.summary}`,
    url: window.location.origin
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200 relative">
        
        <div className="absolute top-6 right-6 z-10">
             <button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-brand-gray dark:text-gray-300 hover:text-brand-green hover:bg-brand-green/10 transition-colors"
                title="Share Analysis"
             >
                 <ShareIcon className="h-6 w-6" />
             </button>
        </div>

        <h2 className="text-3xl font-bold text-brand-green-dark dark:text-brand-green text-center pr-10 pl-10">{result.productName}</h2>
        
        <div className="mt-4 flex flex-col items-center">
            {!searchResult && !isSearching && (
                <button 
                    onClick={handleWebSearch}
                    className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                    <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                    Search for latest reviews & safety info
                </button>
            )}
            
            {isSearching && <Spinner className="text-blue-500 w-5 h-5 mt-2" />}

            {searchError && <p className="text-sm text-red-500 mt-2">{searchError}</p>}

            {searchResult && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 w-full text-left animate-fade-in">
                    <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                        <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                        Web Search Insights
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {searchResult.text}
                    </p>
                    
                    {searchResult.groundingMetadata?.groundingChunks?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Sources:</p>
                            <ul className="space-y-1">
                                {searchResult.groundingMetadata.groundingChunks.map((chunk: any, idx: number) => {
                                    if (chunk.web) {
                                        return (
                                            <li key={idx}>
                                                <a 
                                                    href={chunk.web.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-full"
                                                >
                                                    {chunk.web.title || chunk.web.uri}
                                                </a>
                                            </li>
                                        );
                                    }
                                    return null;
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {result.recallInfo && (
        <div className={`p-5 rounded-xl shadow-md transition-all duration-300 border ${
            result.recallInfo.hasRecall 
            ? 'bg-red-100 dark:bg-red-900/30 border-red-500 dark:border-red-500 border-2 ring-4 ring-red-100 dark:ring-red-900/20' 
            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        }`}>
            <div className="flex items-center mb-2">
                {result.recallInfo.hasRecall ? (
                    <div className="relative flex-shrink-0">
                         <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                         <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400 relative z-10" />
                    </div>
                ) : (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
                <h3 className={`text-lg font-bold ml-4 ${result.recallInfo.hasRecall ? 'text-red-800 dark:text-red-200 text-xl uppercase tracking-wide' : 'text-green-800 dark:text-green-300'}`}>
                    {result.recallInfo.hasRecall ? '⚠️ Recall Alert Detected' : 'Safety Check: No Recalls'}
                </h3>
            </div>
            <div className={result.recallInfo.hasRecall ? "ml-12" : "ml-9"}>
                 <p className={`text-sm ${result.recallInfo.hasRecall ? 'text-red-900 dark:text-red-100 font-medium text-base' : 'text-green-700 dark:text-green-200'} leading-relaxed`}>
                    {result.recallInfo.details}
                </p>
                {result.recallInfo.date && (
                    <p className={`text-xs mt-2 font-mono opacity-80 ${result.recallInfo.hasRecall ? 'text-red-900 dark:text-red-200 font-bold' : 'text-green-800 dark:text-green-300'}`}>
                        Reported Date: {result.recallInfo.date}
                    </p>
                )}
            </div>
        </div>
      )}

      <InfoCard title="Personalized Skin Analysis" icon={<InformationCircleIcon className="h-6 w-6 text-blue-500" />}>
        <p className="text-brand-gray dark:text-gray-300 text-base mb-4">{result.skinAnalysis.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                    Potential Positives
                </h4>
                <ul className="space-y-2 text-sm text-brand-gray-dark dark:text-gray-300">
                    {result.skinAnalysis.positiveEffects.map((effect, i) => (
                        <li key={i} className="flex items-start">
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"/>
                            <span>{effect}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div>
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500"/>
                    Things to Watch
                </h4>
                <ul className="space-y-2 text-sm text-brand-gray-dark dark:text-gray-300">
                    {result.skinAnalysis.negativeEffects.map((effect, i) => (
                        <li key={i} className="flex items-start">
                            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0"/>
                            <span>{effect}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </InfoCard>

      <InfoCard title="Key Ingredients" icon={<LeafIcon className="h-6 w-6 text-green-500" />}>
        <ul className="space-y-4">
          {result.ingredients.map((item, i) => (
            <li key={i} className="text-sm flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
               <div className="flex-shrink-0 pt-0.5">
                  <button 
                    onClick={() => onViewIngredient(item.name)} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-brand-green/10 text-brand-green-dark dark:text-brand-green-light border border-brand-green/20 hover:bg-brand-green hover:text-white dark:hover:text-white transition-all duration-200 shadow-sm group"
                    title="Tap for details"
                  >
                     {item.name}
                     <InformationCircleIcon className="h-3.5 w-3.5 ml-1.5 opacity-70 group-hover:opacity-100"/>
                  </button>
              </div>
              <span className="text-brand-gray dark:text-gray-300 leading-relaxed flex-grow">{item.description}</span>
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard title="Nutritional Info" icon={<LeafIcon className="h-6 w-6 text-purple-500" />}>
         <ul className="space-y-3">
          {result.nutrients.map((item, i) => (
            <li key={i} className="text-sm">
              <span className="font-semibold text-brand-gray-dark dark:text-white">{item.name} ({item.amount}):</span>
              <span className="text-brand-gray dark:text-gray-400 ml-1">{item.description}</span>
            </li>
          ))}
        </ul>
      </InfoCard>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        data={shareData} 
      />
    </div>
  );
};

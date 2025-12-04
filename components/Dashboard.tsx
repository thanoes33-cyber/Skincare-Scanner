
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { User, UserProfile, AnalysisResult, GlossaryEntry, ScanHistoryItem, ActivityItem } from '../types';
import { UserProfileForm } from './UserProfileForm';
import { ProductScanner } from './ProductScanner';
import { AnalysisDisplay } from './AnalysisDisplay';
import { ActivityTracker } from './ActivityTracker';
import { ChatBot } from './ChatBot';
import { LeafIcon } from './icons/LeafIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ClockIcon } from './icons/ClockIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { StarIcon } from './icons/StarIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { AccessibilityIcon } from './icons/AccessibilityIcon';
import { analyzeProduct, analyzeTextProduct, getIngredientInfo, findProductImage, searchProductSelections } from '../services/geminiService';
import { GlossaryModal } from './GlossaryModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { ProductSelectionModal } from './ProductSelectionModal';
import { AccessibilityModal } from './AccessibilityModal';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigateToAbout: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
    skinType: 'Normal',
    skinConcerns: [],
    healthConditions: '',
    ingredientSensitivities: {},
};

const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 150;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else {
                    resolve(e.target?.result as string);
                }
            };
            img.onerror = () => resolve('');
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser, isDarkMode, toggleTheme, onNavigateToAbout }) => {
  const { playClick, playSuccess, playError, playScanComplete, announce } = useAccessibility();
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem(`userProfile_${user.email}`);
      return savedProfile ? JSON.parse(savedProfile) : DEFAULT_PROFILE;
    } catch (error) {
      return DEFAULT_PROFILE;
    }
  });

  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  const [historyTab, setHistoryTab] = useState<'all' | 'favorites'>('all');
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [productImage, setProductImage] = useState<File | null>(null);
  const [scanContext, setScanContext] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [productSelections, setProductSelections] = useState<string[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(`userProfile_${user.email}`, JSON.stringify(userProfile));
    } catch (error) {
      console.error("Failed to save user profile", error);
    }
  }, [userProfile, user.email]);

  const enforceHistoryLimit = useCallback((items: ScanHistoryItem[]) => {
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    const favorites = sorted.filter(i => i.favorite);
    const others = sorted.filter(i => !i.favorite);
    const keptFavorites = favorites.slice(0, 50);
    const remainingSlots = 100 - keptFavorites.length;
    const keptOthers = others.slice(0, Math.max(0, remainingSlots));
    return [...keptFavorites, ...keptOthers].sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  useEffect(() => {
      const loadData = () => {
        try {
            const savedHistory = localStorage.getItem(`skincare_history_${user.email}`);
            if (savedHistory) {
                const parsed = JSON.parse(savedHistory);
                setHistory(enforceHistoryLimit(parsed));
            }
            const savedActivities = localStorage.getItem(`skincare_activities_${user.email}`);
            if (savedActivities) {
                setActivities(JSON.parse(savedActivities));
            }
        } catch (e) {
            console.error("Failed to load data", e);
        }
      };
      loadData();
      const handleStorageChange = (e: StorageEvent) => {
          if (e.key === `skincare_history_${user.email}` || e.key === `skincare_activities_${user.email}`) {
              loadData();
          }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
  }, [user.email, enforceHistoryLimit]);

  useEffect(() => {
    if (!productImage) setScanContext('');
  }, [productImage]);

  const filteredHistory = useMemo(() => {
      return history.filter(item => {
          if (historyTab === 'favorites' && !item.favorite) return false;
          const matchesName = item.productName.toLowerCase().includes(filterName.toLowerCase());
          let matchesStart = true;
          if (filterStartDate) {
              const [y, m, d] = filterStartDate.split('-').map(Number);
              const start = new Date(y, m - 1, d, 0, 0, 0, 0);
              matchesStart = item.timestamp >= start.getTime();
          }
          let matchesEnd = true;
          if (filterEndDate) {
              const [y, m, d] = filterEndDate.split('-').map(Number);
              const end = new Date(y, m - 1, d, 23, 59, 59, 999);
              matchesEnd = item.timestamp <= end.getTime();
          }
          return matchesName && matchesStart && matchesEnd;
      });
  }, [history, filterName, filterStartDate, filterEndDate, historyTab]);

  const clearFilters = () => {
      setFilterName('');
      setFilterStartDate('');
      setFilterEndDate('');
      announce("Filters cleared");
  };

  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [glossaryEntry, setGlossaryEntry] = useState<GlossaryEntry | null>(null);
  const [isGlossaryLoading, setIsGlossaryLoading] = useState<boolean>(false);
  const [glossaryError, setGlossaryError] = useState<string>('');

  const saveToHistory = async (result: AnalysisResult, source: File | string) => {
      try {
          let thumbnail = '';
          if (source instanceof File) {
            thumbnail = await generateThumbnail(source);
          } else {
            thumbnail = source; 
          }
          const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
          const newItem: ScanHistoryItem = {
              id,
              timestamp: Date.now(),
              productName: result.productName,
              thumbnail,
              result,
              favorite: false
          };
          setHistory(prev => {
              let updated = [newItem, ...prev];
              updated = enforceHistoryLimit(updated);
              localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
              return updated;
          });
          const activityItem: ActivityItem = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
            type: 'scan',
            title: `Analyzed: ${result.productName}`,
            details: `Ingredients analyzed: ${result.ingredients.length}. Skin Impact: ${result.skinAnalysis.summary.substring(0, 60)}...`,
            timestamp: Date.now(),
            durationMinutes: 0
          };
          setActivities(prev => {
              const updated = [activityItem, ...prev];
              localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
              return updated;
          });
      } catch (e) {
          console.error("Error saving to history", e);
      }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      playClick();
      if (window.confirm("Are you sure you want to delete this item permanently?")) {
          setHistory(prev => {
              const updated = prev.filter(item => item.id !== id);
              localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
              return updated;
          });
          announce("Item deleted");
      }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      playClick();
      setHistory(prev => {
          const itemToToggle = prev.find(item => item.id === id);
          if (itemToToggle && !itemToToggle.favorite) {
              const currentFavoritesCount = prev.filter(i => i.favorite).length;
              if (currentFavoritesCount >= 50) {
                  alert("You can only have up to 50 favorites. Please remove some favorites before adding more.");
                  return prev;
              }
              playSuccess();
              announce("Added to favorites");
          } else {
              announce("Removed from favorites");
          }
          let updated = prev.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item);
          updated = enforceHistoryLimit(updated); 
          localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
          return updated;
      });
  };

  const clearAllHistory = () => {
    if (history.length === 0) return;
    playClick();
    if (window.confirm("Are you sure you want to clear your entire scan history? Favorites will be kept.")) {
        setHistory(prev => {
            const favorites = prev.filter(item => item.favorite);
            localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(favorites));
            return favorites;
        });
        announce("History cleared");
    }
  };

  const selectHistoryItem = (item: ScanHistoryItem) => {
      playClick();
      setAnalysisResult(item.result);
      setProductImage(null);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      announce(`Selected ${item.productName}`);
  };

  const handleAddActivity = (item: Omit<ActivityItem, 'id'>) => {
    const newItem: ActivityItem = { ...item, id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() };
    setActivities(prev => {
        const updated = [newItem, ...prev];
        localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
        return updated;
    });
    playSuccess();
  };

  const handleEditActivity = (updatedItem: ActivityItem) => {
    setActivities(prev => {
        const updated = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
        localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
        return updated;
    });
    playSuccess();
  };

  const handleDeleteActivity = (id: string) => {
      setActivities(prev => {
          const updated = prev.filter(a => a.id !== id);
          localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
          return updated;
      });
      playClick();
  };

  const handleBarcodeDetected = (code: string) => {
      setScanContext(`Detected Barcode/QR Code content: ${code}. Please use this to identify the exact product.`);
      // Audio cue is handled inside ProductScanner on successful detection to avoid spamming here
  };

  const handleAnalyze = useCallback(async () => {
    if (!productImage) {
      setError('Please select an image to analyze.');
      playError();
      return;
    }
    playClick();
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    announce("Analyzing product, please wait...");

    try {
      const result = await analyzeProduct(productImage, userProfile, scanContext);
      setAnalysisResult(result);
      await saveToHistory(result, productImage);
      playScanComplete();
      announce(`Analysis complete for ${result.productName}`);
    } catch (e) {
      playError();
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      announce("Analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [productImage, userProfile, scanContext, playClick, playError, playScanComplete, announce]);

  const handleSearch = useCallback(async (query: string) => {
      playClick();
      setIsLoading(true);
      setError('');
      setAnalysisResult(null);
      setProductImage(null);
      setCurrentSearchQuery(query);
      announce(`Searching for ${query}`);
      
      try {
          const options = await searchProductSelections(query);
          setProductSelections(options);
          setIsSelectionModalOpen(true);
          playSuccess();
      } catch (e) {
          playError();
          setError(e instanceof Error ? e.message : 'Failed to search for products.');
      } finally {
          setIsLoading(false);
      }
  }, [playClick, playSuccess, playError, announce]);

  const handleProductSelect = useCallback(async (productName: string) => {
      playClick();
      setIsSelectionModalOpen(false);
      setIsLoading(true);
      setError('');
      setAnalysisResult(null);
      setProductImage(null);
      announce(`Analyzing ${productName}`);
      
      try {
          const result = await analyzeTextProduct(productName, userProfile);
          setAnalysisResult(result);
          const imageUrl = await findProductImage(productName);
          await saveToHistory(result, imageUrl || '');
          playScanComplete();
          announce(`Analysis complete for ${result.productName}`);
      } catch (e) {
          playError();
          setError(e instanceof Error ? e.message : 'Failed to analyze product.');
      } finally {
          setIsLoading(false);
      }
  }, [userProfile, playClick, playError, playScanComplete, announce]);

  const handleViewIngredient = useCallback(async (ingredientName: string) => {
    playClick();
    setSelectedIngredient(ingredientName);
    setIsGlossaryLoading(true);
    setGlossaryEntry(null);
    setGlossaryError('');
    announce(`Loading info for ${ingredientName}`);
    try {
      const entry = await getIngredientInfo(ingredientName);
      setGlossaryEntry(entry);
      playSuccess();
      announce(`Info loaded for ${ingredientName}`);
    } catch (e) {
      playError();
      setGlossaryError(e instanceof Error ? e.message : 'Failed to load ingredient details.');
    } finally {
      setIsGlossaryLoading(false);
    }
  }, [playClick, playSuccess, playError, announce]);

  const hasFilters = filterName || filterStartDate || filterEndDate;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 font-sans text-brand-gray-dark dark:text-gray-200 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <LeafIcon className="h-8 w-8 text-brand-green" />
                <h1 className="ml-3 text-2xl sm:text-3xl font-bold text-brand-green-dark dark:text-white tracking-tight">
                    Skincare Scanner
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => { toggleTheme(); playClick(); }} 
                    className="p-2 rounded-full text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:ring-2 focus:ring-brand-green focus:outline-none"
                    aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
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
                
                <div 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors focus-within:ring-2 focus-within:ring-brand-green"
                  onClick={() => { setIsAccountModalOpen(true); playClick(); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIsAccountModalOpen(true); playClick(); } }}
                  aria-label="Edit Profile"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500">
                    {user.photo ? (
                      <img src={user.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <UserCircleIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-brand-gray-dark dark:text-white leading-none">{user.firstName}</p>
                  </div>
                </div>

                <button 
                    onClick={() => { onLogout(); playClick(); }}
                    className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors border border-red-200 dark:border-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                    Log Out
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow flex flex-col">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
          <div className="lg:col-span-5 space-y-8 flex flex-col">
            <UserProfileForm userProfile={userProfile} setUserProfile={setUserProfile} />
            <div className="h-[500px]">
                <ActivityTracker 
                    activities={activities} 
                    onAddActivity={handleAddActivity} 
                    onEditActivity={handleEditActivity}
                    onDeleteActivity={handleDeleteActivity} 
                />
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8 flex flex-col">
            <ProductScanner
              productImage={productImage}
              setProductImage={setProductImage}
              onAnalyze={handleAnalyze}
              onSearch={handleSearch}
              isLoading={isLoading}
              onBarcodeDetected={handleBarcodeDetected}
            />
            
             <AnalysisDisplay
                result={analysisResult}
                isLoading={isLoading}
                error={error}
                onViewIngredient={handleViewIngredient}
             />

            {history.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200">
                    <div className="flex items-center justify-between mb-6">
                         <div className="flex space-x-6" role="tablist">
                            <button
                                role="tab"
                                aria-selected={historyTab === 'all'}
                                onClick={() => { setHistoryTab('all'); playClick(); }}
                                className={`text-lg font-bold flex items-center pb-2 border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green rounded-t ${
                                    historyTab === 'all' 
                                    ? 'text-brand-green border-brand-green' 
                                    : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            >
                                <ClockIcon className={`h-5 w-5 mr-2 ${historyTab === 'all' ? 'text-brand-green' : 'text-gray-400'}`} />
                                Recent Scans
                            </button>
                            <button
                                role="tab"
                                aria-selected={historyTab === 'favorites'}
                                onClick={() => { setHistoryTab('favorites'); playClick(); }}
                                className={`text-lg font-bold flex items-center pb-2 border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-green rounded-t ${
                                    historyTab === 'favorites' 
                                    ? 'text-brand-green border-brand-green' 
                                    : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            >
                                <StarIcon filled={true} className={`h-5 w-5 mr-2 ${historyTab === 'favorites' ? 'text-brand-green' : 'text-gray-400'}`} />
                                My Favorites
                            </button>
                        </div>
                        {historyTab === 'all' && (
                            <button
                                onClick={clearAllHistory}
                                className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    
                    <div className="mb-4 space-y-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search history..."
                                aria-label="Filter history by product name"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-colors"
                            />
                            {filterName && (
                                <button
                                    onClick={() => setFilterName('')}
                                    aria-label="Clear search"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="date"
                                aria-label="Filter start date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="flex-1 py-2 px-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-colors"
                            />
                            <input
                                type="date"
                                aria-label="Filter end date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="flex-1 py-2 px-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-colors"
                            />
                        </div>
                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-brand-green hover:text-brand-green-dark dark:hover:text-brand-green-light flex items-center justify-end w-full"
                            >
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                Clear Filters
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {filteredHistory.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                                {historyTab === 'favorites' 
                                    ? (hasFilters ? 'No favorite scans match your filters.' : 'No favorites yet.') 
                                    : (hasFilters ? 'No scans match your filters.' : 'No scan history yet.')}
                            </p>
                        ) : (
                            filteredHistory.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => selectHistoryItem(item)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') selectHistoryItem(item); }}
                                    className="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all group border border-transparent hover:border-brand-green/30 relative focus:outline-none focus:ring-2 focus:ring-brand-green"
                                >
                                    <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600">
                                        {item.thumbnail ? (
                                             <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                                                <LeafIcon className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-grow min-w-0 pr-24 sm:pr-20">
                                        <h4 className="text-sm font-bold text-brand-gray-dark dark:text-white truncate">{item.productName}</h4>
                                        <p className="text-xs text-brand-gray dark:text-gray-400 mt-1">
                                            {new Date(item.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div 
                                        className="flex items-center space-x-2 absolute right-3 top-1/2 -translate-y-1/2 z-10"
                                        onClick={(e) => e.stopPropagation()}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                    >
                                         <button 
                                            type="button"
                                            onClick={(e) => toggleFavorite(item.id, e)}
                                            className={`p-2.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 ${
                                                item.favorite 
                                                ? 'text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                                                : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                            title={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                                            aria-label={item.favorite ? "Remove from Favorites" : "Add to Favorites"}
                                        >
                                            <StarIcon filled={item.favorite} className="h-5 w-5 pointer-events-none" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => deleteHistoryItem(item.id, e)}
                                            className="p-2.5 rounded-full text-red-500 border border-red-500 bg-white hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 shadow-sm"
                                            title="Delete Item"
                                            aria-label="Delete Item"
                                        >
                                            <TrashIcon className="h-5 w-5 pointer-events-none" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>
        </div>
      </main>

      <ChatBot userProfile={userProfile} />
      
      {isAccountModalOpen && (
        <AccountSettingsModal 
            user={user} 
            onSave={onUpdateUser} 
            onClose={() => setIsAccountModalOpen(false)} 
        />
      )}

      {isAccessibilityModalOpen && (
        <AccessibilityModal 
            isOpen={isAccessibilityModalOpen} 
            onClose={() => setIsAccessibilityModalOpen(false)} 
        />
      )}

      <ProductSelectionModal
         isOpen={isSelectionModalOpen}
         onClose={() => setIsSelectionModalOpen(false)}
         selections={productSelections}
         onSelect={handleProductSelect}
         query={currentSearchQuery}
      />

      {selectedIngredient && (
        <GlossaryModal
          ingredientName={selectedIngredient}
          entry={glossaryEntry}
          isLoading={isGlossaryLoading}
          error={glossaryError}
          onClose={() => setSelectedIngredient(null)}
        />
      )}

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 py-8 text-center text-gray-500 text-sm bg-gray-50 dark:bg-gray-900 relative z-10 transition-colors duration-200">
         <p className="mb-3 font-medium opacity-80">&copy; {new Date().getFullYear()} Skincare Scanner.</p>
         <button 
            onClick={onNavigateToAbout}
            className="text-brand-green font-semibold hover:underline underline-offset-4 decoration-2 transition-all hover:text-brand-green-dark dark:hover:text-brand-green-light focus:outline-none focus:ring-2 focus:ring-brand-green rounded px-2"
         >
            About Skincare Scanner
         </button>
      </footer>
    </div>
  );
};

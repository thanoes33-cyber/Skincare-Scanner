
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { User, UserProfile, AnalysisResult, GlossaryEntry, ScanHistoryItem, ActivityItem } from '../types';
import { UserProfileForm } from './UserProfileForm';
import { ProductScanner } from './ProductScanner';
import { AnalysisDisplay } from './AnalysisDisplay';
import { ActivityTracker } from './ActivityTracker';
import { LeafIcon } from './icons/LeafIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ClockIcon } from './icons/ClockIcon';
import { TrashIcon } from './icons/TrashIcon';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { StarIcon } from './icons/StarIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { analyzeProduct, analyzeTextProduct, getIngredientInfo, findProductImage, searchProductSelections } from '../services/geminiService';
import { GlossaryModal } from './GlossaryModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { ProductSelectionModal } from './ProductSelectionModal';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
    skinType: 'Normal',
    skinConcerns: [],
    healthConditions: '',
    ingredientSensitivities: {},
};

// Helper to generate a small thumbnail from a file
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
                    resolve(e.target?.result as string); // Fallback
                }
            };
            img.onerror = () => resolve(''); // Handle error
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    });
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUpdateUser, isDarkMode, toggleTheme }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem(`userProfile_${user.email}`);
      return savedProfile ? JSON.parse(savedProfile) : DEFAULT_PROFILE;
    } catch (error) {
      console.error("Failed to parse user profile from localStorage", error);
      return DEFAULT_PROFILE;
    }
  });

  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Filter states
  const [historyTab, setHistoryTab] = useState<'all' | 'favorites'>('all');
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Analysis state
  const [productImage, setProductImage] = useState<File | null>(null);
  const [scanContext, setScanContext] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Search Selection State
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [productSelections, setProductSelections] = useState<string[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(`userProfile_${user.email}`, JSON.stringify(userProfile));
    } catch (error) {
      console.error("Failed to save user profile to localStorage", error);
    }
  }, [userProfile, user.email]);

  // Centralized logic to limit history size to strict 50 items for favorites
  // and reasonable limit for total items
  const enforceHistoryLimit = useCallback((items: ScanHistoryItem[]) => {
    // 1. Sort all by timestamp desc first to ensure we process newest first
    const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);
    
    // Separate favorites and others
    const favorites = sorted.filter(i => i.favorite);
    const others = sorted.filter(i => !i.favorite);

    // STRICT LIMIT: Favorites can only have 50 items max.
    // If user tries to add more, the oldest favorites are removed or un-favorited (removed here implies un-favorited effectively if dropped from list entirely, but realistically we drop from history).
    // In this implementation, we keep the newest 50 favorites.
    const keptFavorites = favorites.slice(0, 50);
    
    // Also limit total history to prevent storage issues (e.g., 100 items total)
    // We prioritize keeping favorites.
    const remainingSlots = 100 - keptFavorites.length;
    const keptOthers = others.slice(0, Math.max(0, remainingSlots));

    // Combine and resort
    return [...keptFavorites, ...keptOthers].sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  useEffect(() => {
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
  }, [user.email, enforceHistoryLimit]);

  // Clear scan context if image is removed (Retake)
  useEffect(() => {
    if (!productImage) {
      setScanContext('');
    }
  }, [productImage]);

  const filteredHistory = useMemo(() => {
      return history.filter(item => {
          // Tab Filter
          if (historyTab === 'favorites' && !item.favorite) return false;

          // Name filter
          const matchesName = item.productName.toLowerCase().includes(filterName.toLowerCase());
          
          // Date filter
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
            thumbnail = source; // Assume it's a URL string for text searches
          }
          
          const id = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(36) + Math.random().toString(36).substr(2);

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
              try {
                  localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
              } catch (e) {
                  console.warn("LocalStorage quota exceeded.", e);
                  // Drastic fallback if quota exceeded
                  updated = updated.slice(0, 20);
                  try {
                      localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
                  } catch (retryError) {
                      console.error("Critical: Failed to save history", retryError);
                  }
              }
              return updated;
          });

          // Auto-log to Activity Tracker
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
              try {
                localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
              } catch (e) {
                 console.error("Failed to save activity", e);
              }
              return updated;
          });

      } catch (e) {
          console.error("Error saving to history", e);
      }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation(); // Always stop propagation first
      e.preventDefault();
      
      if (window.confirm("Are you sure you want to delete this item permanently?")) {
          setHistory(prev => {
              const updated = prev.filter(item => item.id !== id);
              localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
              return updated;
          });
      }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation(); // Always stop propagation first
      e.preventDefault();
      
      setHistory(prev => {
          const itemToToggle = prev.find(item => item.id === id);
          // If currently not favorite, check limit before adding
          if (itemToToggle && !itemToToggle.favorite) {
              const currentFavoritesCount = prev.filter(i => i.favorite).length;
              if (currentFavoritesCount >= 50) {
                  alert("You can only have up to 50 favorites. Please remove some favorites before adding more.");
                  return prev;
              }
          }

          let updated = prev.map(item => 
            item.id === id ? { ...item, favorite: !item.favorite } : item
          );
          
          updated = enforceHistoryLimit(updated); 
          localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(updated));
          return updated;
      });
  };

  const clearAllHistory = () => {
    if (history.length === 0) return;
    if (window.confirm("Are you sure you want to clear your entire scan history? Favorites will be kept.")) {
        setHistory(prev => {
            const favorites = prev.filter(item => item.favorite);
            localStorage.setItem(`skincare_history_${user.email}`, JSON.stringify(favorites));
            return favorites;
        });
    }
  };

  const selectHistoryItem = (item: ScanHistoryItem) => {
      setAnalysisResult(item.result);
      setProductImage(null);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Activity Tracker Methods
  const handleAddActivity = (item: Omit<ActivityItem, 'id'>) => {
    const newItem: ActivityItem = {
        ...item,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    };
    setActivities(prev => {
        const updated = [newItem, ...prev];
        localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
        return updated;
    });
  };

  const handleEditActivity = (updatedItem: ActivityItem) => {
    setActivities(prev => {
        const updated = prev.map(item => item.id === updatedItem.id ? updatedItem : item);
        localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
        return updated;
    });
  };

  const handleDeleteActivity = (id: string) => {
      setActivities(prev => {
          const updated = prev.filter(a => a.id !== id);
          localStorage.setItem(`skincare_activities_${user.email}`, JSON.stringify(updated));
          return updated;
      });
  };

  const handleBarcodeDetected = (code: string) => {
      setScanContext(`Detected Barcode/QR Code content: ${code}. Please use this to identify the exact product.`);
  };

  const handleAnalyze = useCallback(async () => {
    if (!productImage) {
      setError('Please select an image to analyze.');
      return;
    }

    setIsLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      const result = await analyzeProduct(productImage, userProfile, scanContext);
      setAnalysisResult(result);
      await saveToHistory(result, productImage);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [productImage, userProfile, scanContext]);

  // 1. Trigger search for selections
  const handleSearch = useCallback(async (query: string) => {
      setIsLoading(true);
      setError('');
      setAnalysisResult(null);
      setProductImage(null);
      setCurrentSearchQuery(query);
      
      try {
          // Step 1: Find product selections
          const options = await searchProductSelections(query);
          setProductSelections(options);
          setIsSelectionModalOpen(true);
      } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          } else {
            setError('Failed to search for products.');
          }
      } finally {
          setIsLoading(false);
      }
  }, []);

  // 2. Confirm selection and analyze
  const handleProductSelect = useCallback(async (productName: string) => {
      setIsSelectionModalOpen(false);
      setIsLoading(true);
      setError('');
      setAnalysisResult(null);
      setProductImage(null);
      
      try {
          // Step 2: Analyze the specific selected product
          const result = await analyzeTextProduct(productName, userProfile);
          setAnalysisResult(result);

          // Step 3: Try to find an image URL for the history thumbnail
          const imageUrl = await findProductImage(productName);
          
          // Step 4: Save to history
          await saveToHistory(result, imageUrl || '');
      } catch (e) {
           if (e instanceof Error) {
            setError(e.message);
          } else {
            setError('Failed to analyze product.');
          }
      } finally {
          setIsLoading(false);
      }
  }, [userProfile]);

  const handleViewIngredient = useCallback(async (ingredientName: string) => {
    setSelectedIngredient(ingredientName);
    setIsGlossaryLoading(true);
    setGlossaryEntry(null);
    setGlossaryError('');
    try {
      const entry = await getIngredientInfo(ingredientName);
      setGlossaryEntry(entry);
    } catch (e) {
      setGlossaryError(e instanceof Error ? e.message : 'Failed to load ingredient details.');
    } finally {
      setIsGlossaryLoading(false);
    }
  }, []);

  const handleCloseGlossary = () => {
    setSelectedIngredient(null);
    setGlossaryEntry(null);
    setGlossaryError('');
  };

  const hasFilters = filterName || filterStartDate || filterEndDate;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-brand-gray-dark dark:text-gray-200 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <LeafIcon className="h-8 w-8 text-brand-green" />
                <h1 className="ml-3 text-2xl sm:text-3xl font-bold text-brand-green-dark dark:text-white tracking-tight">
                    Skincare Scanner
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    aria-label="Toggle dark mode"
                >
                    {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
                </button>
                
                <div 
                  className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                  onClick={() => setIsAccountModalOpen(true)}
                  title="Edit Profile"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500">
                    {user.photo ? (
                      <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <UserCircleIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-brand-gray-dark dark:text-white leading-none">{user.firstName}</p>
                    <p className="text-[10px] text-brand-gray dark:text-gray-400 leading-tight">
                        {user.subscriptionStatus === 'Active' ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                <button 
                    onClick={onLogout}
                    className="text-sm font-semibold text-red-500 hover:text-red-700 transition-colors border border-red-200 dark:border-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10"
                >
                    Log Out
                </button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Profile & Tracker */}
          <div className="lg:col-span-5 space-y-8">
            <UserProfileForm userProfile={userProfile} setUserProfile={setUserProfile} />
            
            {/* Activity Tracker Component */}
            <div className="h-[500px]">
                <ActivityTracker 
                    activities={activities} 
                    onAddActivity={handleAddActivity} 
                    onEditActivity={handleEditActivity}
                    onDeleteActivity={handleDeleteActivity} 
                />
            </div>
          </div>

          {/* Right Column - Scanner & Results */}
          <div className="lg:col-span-7 space-y-8">
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

            {/* Tabbed History Section */}
            {history.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200">
                    <div className="flex items-center justify-between mb-6">
                         <div className="flex space-x-6">
                            <button
                                onClick={() => setHistoryTab('all')}
                                className={`text-lg font-bold flex items-center pb-2 border-b-2 transition-all duration-200 ${
                                    historyTab === 'all' 
                                    ? 'text-brand-green border-brand-green' 
                                    : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            >
                                <ClockIcon className={`h-5 w-5 mr-2 ${historyTab === 'all' ? 'text-brand-green' : 'text-gray-400'}`} />
                                Recent Scans
                            </button>
                            <button
                                onClick={() => setHistoryTab('favorites')}
                                className={`text-lg font-bold flex items-center pb-2 border-b-2 transition-all duration-200 ${
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
                                className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                    
                    {/* Filters */}
                    <div className="mb-4 space-y-3 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search items..."
                                aria-label="Filter by product name"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-colors"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="date"
                                aria-label="Start date"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="flex-1 py-2 px-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-colors"
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                aria-label="End date"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="flex-1 py-2 px-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-colors"
                                placeholder="End Date"
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
                                    ? (hasFilters ? 'No favorite scans match your filters.' : 'No favorites yet. Star an item to add it here!') 
                                    : (hasFilters ? 'No scans match your filters.' : 'No scan history yet.')}
                            </p>
                        ) : (
                            filteredHistory.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => selectHistoryItem(item)}
                                    className="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all group border border-transparent hover:border-brand-green/30 relative"
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
                                            {new Date(item.timestamp).toLocaleDateString()} &bull; {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    <div 
                                        className="flex items-center space-x-2 absolute right-3 top-1/2 -translate-y-1/2 z-30"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                        }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onMouseUp={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onTouchEnd={(e) => e.stopPropagation()}
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
                                        >
                                            <StarIcon filled={item.favorite} className="h-5 w-5 pointer-events-none" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={(e) => deleteHistoryItem(item.id, e)}
                                            className="p-2.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                            title="Delete Item"
                                        >
                                            <TrashIcon className="h-5 w-5 pointer-events-none" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {historyTab === 'favorites' && filteredHistory.length > 0 && (
                         <p className="text-[10px] text-gray-400 text-center mt-3">
                             Favorites list is limited to 50 items.
                         </p>
                    )}
                </div>
            )}
          </div>
        </div>
      </main>
      
      {isAccountModalOpen && (
        <AccountSettingsModal 
            user={user} 
            onSave={onUpdateUser} 
            onClose={() => setIsAccountModalOpen(false)} 
        />
      )}

      {/* Product Selection Modal */}
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
          onClose={handleCloseGlossary}
        />
      )}

      <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db; 
            border-radius: 10px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af; 
          }
      `}</style>
    </div>
  );
};

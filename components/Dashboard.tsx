
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { UserProfile, AnalysisResult, GlossaryEntry, ScanHistoryItem, ActivityItem } from '../types';
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
import { AccessibilityIcon } from './icons/AccessibilityIcon';
import { analyzeProduct, analyzeTextProduct, getIngredientInfo, findProductImage, searchProductSelections } from '../services/geminiService';
import { GlossaryModal } from './GlossaryModal';
import { ProductSelectionModal } from './ProductSelectionModal';
import { AccessibilityModal } from './AccessibilityModal';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { HumanBodyDiagram } from './HumanBodyDiagram';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, orderBy, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { User } from 'firebase/auth';

interface DashboardProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onNavigateToAbout: () => void;
  user: User;
  onLogout: () => void;
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

export const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, toggleTheme, onNavigateToAbout, user, onLogout }) => {
  const { playClick, playSuccess, playError, playScanComplete, announce } = useAccessibility();
  
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);

  const [historyTab, setHistoryTab] = useState<'all' | 'favorites'>('all');
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [productImage, setProductImage] = useState<File | null>(null);
  const [scanContext, setScanContext] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [productSelections, setProductSelections] = useState<string[]>([]);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    isAlert?: boolean;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  useEffect(() => {
    if (!user) return;
    
    const loadProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({
            skinType: data.skinType || 'Normal',
            skinConcerns: data.skinConcerns || [],
            healthConditions: data.healthConditions || '',
            ingredientSensitivities: data.ingredientSensitivities || {},
          });
        } else {
          // Create default profile
          await setDoc(docRef, {
            uid: user.uid,
            email: user.email,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            skinType: 'Normal',
            skinConcerns: [],
            healthConditions: '',
            ingredientSensitivities: {}
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const saveProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        await updateDoc(docRef, {
          ...userProfile,
          updatedAt: Date.now()
        });
      } catch (error) {
        // Only log error, don't throw to avoid breaking UI on every keystroke
        console.error("Failed to save user profile to Firestore", error);
      }
    };
    // Debounce or just save on change
    const timeoutId = setTimeout(saveProfile, 1000);
    return () => clearTimeout(timeoutId);
  }, [userProfile, user]);

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
      if (!user) return;

      const historyQuery = query(collection(db, 'scanHistory'), where('uid', '==', user.uid));
      const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
          const items: ScanHistoryItem[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.uid === user.uid) {
                  items.push({
                      id: data.id,
                      timestamp: data.timestamp,
                      productName: data.productName,
                      thumbnail: data.thumbnail || '',
                      result: JSON.parse(data.result),
                      favorite: data.favorite || false
                  });
              }
          });
          setHistory(enforceHistoryLimit(items));
      }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'scanHistory');
      });

      const activitiesQuery = query(collection(db, 'activities'), where('uid', '==', user.uid));
      const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
          const items: ActivityItem[] = [];
          snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.uid === user.uid) {
                  items.push({
                      id: data.id,
                      type: data.type as any,
                      title: data.title,
                      details: data.details,
                      timestamp: data.timestamp,
                      durationMinutes: data.durationMinutes,
                      notes: data.notes
                  });
              }
          });
          setActivities(items.sort((a, b) => b.timestamp - a.timestamp));
      }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'activities');
      });

      return () => {
          unsubscribeHistory();
          unsubscribeActivities();
      };
  }, [user, enforceHistoryLimit]);

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
          
          await setDoc(doc(db, 'scanHistory', id), {
              uid: user.uid,
              id,
              timestamp: Date.now(),
              productName: result.productName,
              thumbnail,
              result: JSON.stringify(result),
              favorite: false
          });

          const activityId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
          await setDoc(doc(db, 'activities', activityId), {
            uid: user.uid,
            id: activityId,
            type: 'scan',
            title: `Analyzed: ${result.productName}`,
            details: `Ingredients analyzed: ${result.ingredients.length}. Skin Impact: ${result.skinAnalysis.summary.substring(0, 60)}...`,
            timestamp: Date.now(),
            durationMinutes: 0
          });

          // Track active history ID
          setActiveHistoryId(id);
      } catch (e) {
          handleFirestoreError(e, OperationType.CREATE, 'scanHistory/activities');
      }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      playClick();
      setConfirmModal({
          isOpen: true,
          message: "Are you sure you want to delete this item permanently?",
          onConfirm: async () => {
              try {
                  await deleteDoc(doc(db, 'scanHistory', id));
                  if (activeHistoryId === id) {
                      setAnalysisResult(null);
                      setActiveHistoryId(null);
                  }
                  announce("Item deleted");
              } catch (error) {
                  handleFirestoreError(error, OperationType.DELETE, `scanHistory/${id}`);
              }
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const toggleFavorite = async (id: string, e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      playClick();
      
      const itemToToggle = history.find(item => item.id === id);
      if (!itemToToggle) return;

      if (!itemToToggle.favorite) {
          const currentFavoritesCount = history.filter(i => i.favorite).length;
          if (currentFavoritesCount >= 50) {
              setConfirmModal({
                  isOpen: true,
                  message: "You can only have up to 50 favorites. Please remove some favorites before adding more.",
                  onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
                  isAlert: true
              });
              return;
          }
          playSuccess();
          announce("Added to favorites");
      } else {
          announce("Removed from favorites");
      }

      try {
          await updateDoc(doc(db, 'scanHistory', id), {
              favorite: !itemToToggle.favorite
          });
      } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `scanHistory/${id}`);
      }
  };

  const clearAllHistory = () => {
    if (history.length === 0) return;
    playClick();
    setConfirmModal({
        isOpen: true,
        message: "Are you sure you want to clear your entire scan history? Favorites will be kept.",
        onConfirm: async () => {
            try {
                const batch = writeBatch(db);
                const nonFavorites = history.filter(item => !item.favorite);
                nonFavorites.forEach(item => {
                    batch.delete(doc(db, 'scanHistory', item.id));
                });
                await batch.commit();
                
                if (activeHistoryId && !history.find(h => h.id === activeHistoryId)?.favorite) {
                    setAnalysisResult(null);
                    setActiveHistoryId(null);
                }
                announce("History cleared");
            } catch (error) {
                handleFirestoreError(error, OperationType.DELETE, 'scanHistory');
            }
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const selectHistoryItem = (item: ScanHistoryItem) => {
      playClick();
      setAnalysisResult(item.result);
      setActiveHistoryId(item.id);
      setProductImage(null);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      announce(`Selected ${item.productName}`);
  };

  const handleAddActivity = async (item: Omit<ActivityItem, 'id'>) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    try {
        await setDoc(doc(db, 'activities', id), {
            ...item,
            id,
            uid: user.uid
        });
        playSuccess();
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `activities/${id}`);
    }
  };

  const handleEditActivity = async (updatedItem: ActivityItem) => {
    try {
        await updateDoc(doc(db, 'activities', updatedItem.id), {
            ...updatedItem
        });
        playSuccess();
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `activities/${updatedItem.id}`);
    }
  };

  const handleDeleteActivity = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'activities', id));
          playClick();
      } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `activities/${id}`);
      }
  };

  const handleBarcodeDetected = (code: string) => {
      setScanContext(`Detected Barcode/QR Code content: ${code}. Please use this to identify the exact product.`);
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
    setActiveHistoryId(null);
    announce("Analyzing product, please wait...");

    try {
      const result = await analyzeProduct(productImage, userProfile, scanContext);
      setAnalysisResult(result);
      await saveToHistory(result, productImage);
      playScanComplete();
      announce(`Analysis complete for ${result.productName}`);
    } catch (e) {
      playError();
      const msg = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(msg);
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
      setActiveHistoryId(null);
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
          const msg = e instanceof Error ? e.message : 'Failed to search for products.';
          setError(msg);
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
      setActiveHistoryId(null);
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
          const msg = e instanceof Error ? e.message : 'Failed to analyze product.';
          setError(msg);
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
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 transition-colors duration-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
                <LeafIcon className="h-8 w-8 text-brand-green" />
                <h1 className="ml-3 text-2xl sm:text-3xl font-bold text-brand-green-dark dark:text-white tracking-tight">
                    Skincare Scanner
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onLogout}
                    className="px-4 py-2 text-sm font-medium text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-brand-green focus:outline-none"
                >
                    Sign Out
                </button>
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
                                             <img src={item.thumbnail || undefined} alt="" className="h-full w-full object-cover" />
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
                                            className="p-2.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
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

      {analysisResult && analysisResult.affectedBodyParts && analysisResult.affectedBodyParts.length > 0 && (
        <HumanBodyDiagram affectedParts={analysisResult.affectedBodyParts} />
      )}

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {confirmModal.isAlert ? 'Notice' : 'Confirm Action'}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {confirmModal.message}
                </p>
                <div className="flex justify-end gap-3">
                    {!confirmModal.isAlert && (
                        <button
                            onClick={() => {
                                playClick();
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => {
                            playClick();
                            confirmModal.onConfirm();
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-brand-green hover:bg-brand-green-dark rounded-lg transition-colors"
                    >
                        {confirmModal.isAlert ? 'OK' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
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

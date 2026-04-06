
import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { AboutPage } from './components/AboutPage';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { auth, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

type ViewState = 'landing' | 'dashboard' | 'about';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const [view, setView] = useState<ViewState>('landing');

  useEffect(() => {
    if (isAuthReady) {
      if (user) {
        setView('dashboard');
      } else {
        setView('landing');
      }
    }
  }, [user, isAuthReady]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('skincare_theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
      setIsDarkMode(prev => {
          const newMode = !prev;
          if (newMode) {
              document.documentElement.classList.add('dark');
              localStorage.setItem('skincare_theme', 'dark');
          } else {
              document.documentElement.classList.remove('dark');
              localStorage.setItem('skincare_theme', 'light');
          }
          return newMode;
      });
  };

  const handleStartApp = async () => {
    if (!user) {
      await signInWithGoogle();
    } else {
      setView('dashboard');
    }
  };
  
  const navigateToAbout = () => setView('about');
  const handleBackFromAbout = () => {
    setView(user ? 'dashboard' : 'landing');
  };

  if (!isAuthReady) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green"></div></div>;
  }

  return (
    <>
        {view === 'dashboard' && user ? (
            <Dashboard 
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme}
                onNavigateToAbout={navigateToAbout}
                user={user}
                onLogout={logOut}
            />
        ) : view === 'about' ? (
            <AboutPage onBack={handleBackFromAbout} />
        ) : (
            <LandingPage onGetStarted={handleStartApp} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onNavigateToAbout={navigateToAbout} />
        )}
         <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <AppContent />
      </AccessibilityProvider>
    </ErrorBoundary>
  );
};

export default App;

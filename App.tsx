
import React, { useState, useEffect, useCallback } from 'react';
import type { User } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { AboutPage } from './components/AboutPage';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

type ViewState = 'landing' | 'auth' | 'dashboard' | 'about';

const DEMO_USER: User = {
    email: 'demo@skincarescanner.app',
    firstName: 'Demo',
    lastName: 'User',
    subscriptionStatus: 'Active',
    bio: 'Developing the future of skincare scanning.',
    photo: ''
};

const AppContent: React.FC = () => {
  // Lazy initialization for persistent session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedLocal = localStorage.getItem('skincare_current_user');
    const storedSession = sessionStorage.getItem('skincare_current_user');
    
    const storedData = storedLocal || storedSession;

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (!parsed.firstName && parsed.name) {
            parsed.firstName = parsed.name.split(' ')[0] || 'User';
            parsed.lastName = parsed.name.split(' ').slice(1).join(' ') || '';
            parsed.subscriptionStatus = 'Active';
        }
        return parsed;
      } catch (e) {
        console.error("Invalid session data", e);
        localStorage.removeItem('skincare_current_user');
        sessionStorage.removeItem('skincare_current_user');
      }
    }
    return DEMO_USER;
  });

  const [view, setView] = useState<ViewState>(() => {
    return currentUser ? 'dashboard' : 'landing';
  });
  
  useEffect(() => {
      if (currentUser && view === 'landing') {
          setView('dashboard');
      }
  }, [currentUser]);

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

  const handleLoginSuccess = (user: User, rememberMe: boolean) => {
    setCurrentUser(user);
    if (rememberMe) {
        localStorage.setItem('skincare_current_user', JSON.stringify(user));
        sessionStorage.removeItem('skincare_current_user');
    } else {
        sessionStorage.setItem('skincare_current_user', JSON.stringify(user));
        localStorage.removeItem('skincare_current_user');
    }
    setView('dashboard');
  };
  
  const handleUserUpdate = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      if (sessionStorage.getItem('skincare_current_user')) {
          sessionStorage.setItem('skincare_current_user', JSON.stringify(updatedUser));
      } else {
          localStorage.setItem('skincare_current_user', JSON.stringify(updatedUser));
      }
      try {
          const storedUsers = JSON.parse(localStorage.getItem('skincare_users') || '[]');
          const updatedList = storedUsers.map((u: any) => {
              if ((u.email || '').trim().toLowerCase() === (updatedUser.email || '').trim().toLowerCase()) {
                  return { 
                      ...u, 
                      ...updatedUser, 
                      password: u.password, 
                      name: `${updatedUser.firstName} ${updatedUser.lastName}` 
                  };
              }
              return u;
          });
          localStorage.setItem('skincare_users', JSON.stringify(updatedList));
      } catch (e) {
          console.error("Failed to update user database", e);
      }
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('skincare_current_user');
    sessionStorage.removeItem('skincare_current_user');
    setView('landing');
  }, []);

  const navigateToAuth = () => setView('auth');
  const navigateToLanding = () => setView('landing');
  const navigateToAbout = () => setView('about');
  const handleBackFromAbout = () => {
    if (currentUser) {
        setView('dashboard');
    } else {
        setView('landing');
    }
  };

  return (
    <>
        {view === 'dashboard' && currentUser ? (
            <Dashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                onUpdateUser={handleUserUpdate}
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme}
                onNavigateToAbout={navigateToAbout}
            />
        ) : view === 'auth' ? (
            <AuthPage onLoginSuccess={handleLoginSuccess} onCancel={navigateToLanding} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        ) : view === 'about' ? (
            <AboutPage onBack={handleBackFromAbout} />
        ) : (
            <LandingPage onGetStarted={navigateToAuth} isDarkMode={isDarkMode} toggleTheme={toggleTheme} onNavigateToAbout={navigateToAbout} />
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
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
};

export default App;

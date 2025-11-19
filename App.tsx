import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';

type ViewState = 'landing' | 'auth' | 'dashboard';

const App: React.FC = () => {
  // Lazy initialization for persistent session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedSession = localStorage.getItem('skincare_current_user');
    if (storedSession) {
      try {
        return JSON.parse(storedSession);
      } catch (e) {
        console.error("Invalid session data", e);
        localStorage.removeItem('skincare_current_user');
      }
    }
    return null;
  });

  const [view, setView] = useState<ViewState>(() => {
    // If session exists, start at dashboard to avoid flash of landing page
    return localStorage.getItem('skincare_current_user') ? 'dashboard' : 'landing';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Theme check
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

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('skincare_current_user', JSON.stringify(user));
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('skincare_current_user');
    setView('landing');
  };

  const navigateToAuth = () => {
    setView('auth');
  };
  
  const navigateToLanding = () => {
    setView('landing');
  };

  if (view === 'dashboard' && currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  if (view === 'auth') {
    return <AuthPage onLoginSuccess={handleLoginSuccess} onCancel={navigateToLanding} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
  }

  return <LandingPage onGetStarted={navigateToAuth} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
};

export default App;
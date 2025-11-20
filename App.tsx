import React, { useState, useEffect, useCallback } from 'react';
import type { User } from './types';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';

type ViewState = 'landing' | 'auth' | 'dashboard';

const App: React.FC = () => {
  // Lazy initialization for persistent session state
  // Checks both LocalStorage (Persistent) and SessionStorage (Tab only)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedLocal = localStorage.getItem('skincare_current_user');
    const storedSession = sessionStorage.getItem('skincare_current_user');
    
    // Prioritize local storage if available, otherwise session
    const storedData = storedLocal || storedSession;

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // Migration helper for old session data if necessary
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
    return null;
  });

  const [view, setView] = useState<ViewState>(() => {
    // If session exists, start at dashboard to avoid flash of landing page
    const hasUser = localStorage.getItem('skincare_current_user') || sessionStorage.getItem('skincare_current_user');
    return hasUser ? 'dashboard' : 'landing';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);

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

  const handleLoginSuccess = (user: User, rememberMe: boolean) => {
    setCurrentUser(user);
    setSessionTimedOut(false);
    
    if (rememberMe) {
        // Persistent Session
        localStorage.setItem('skincare_current_user', JSON.stringify(user));
        sessionStorage.removeItem('skincare_current_user'); // Clear any conflicting session data
    } else {
        // Tab Session
        sessionStorage.setItem('skincare_current_user', JSON.stringify(user));
        localStorage.removeItem('skincare_current_user'); // Clear any conflicting persistent data
    }
    
    setView('dashboard');
  };
  
  const handleUserUpdate = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      
      // Update the storage method currently in use
      if (sessionStorage.getItem('skincare_current_user')) {
          sessionStorage.setItem('skincare_current_user', JSON.stringify(updatedUser));
      } else {
          localStorage.setItem('skincare_current_user', JSON.stringify(updatedUser));
      }
      
      // Also update in the main users array (the 'database')
      try {
          const storedUsers = JSON.parse(localStorage.getItem('skincare_users') || '[]');
          const updatedList = storedUsers.map((u: any) => {
              // Use case-insensitive email check to ensure we update the correct record
              if ((u.email || '').trim().toLowerCase() === (updatedUser.email || '').trim().toLowerCase()) {
                  // IMPORTANT: The 'updatedUser' object (from the session/UI) does not contain the password.
                  // We must explicitly preserve the existing 'u.password' from storage to avoid losing it.
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
          // Optional: Alert user if storage is full
          if (e instanceof DOMException && e.name === "QuotaExceededError") {
              alert("Your storage is full. The profile update could not be saved permanently.");
          }
      }
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    // Clear both storages to be safe
    localStorage.removeItem('skincare_current_user');
    sessionStorage.removeItem('skincare_current_user');
    setView('landing');
  }, []);

  const navigateToAuth = () => {
    setView('auth');
  };
  
  const navigateToLanding = () => {
    setView('landing');
  };

  // Inactivity Timer Effect
  useEffect(() => {
    // Check for persistence. If localStorage has the user, it's a "Remember Me" session.
    // We disable the inactivity timer for these users to truly "remember" them.
    const isPersistent = !!localStorage.getItem('skincare_current_user');
    
    if (!currentUser || isPersistent) return;

    const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes
    let timeoutId: ReturnType<typeof setTimeout>;
    let lastActivityTime = Date.now();

    const triggerLogout = () => {
      handleLogout();
      setSessionTimedOut(true);
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(triggerLogout, TIMEOUT_DURATION);
    };

    const handleActivity = () => {
      // Throttle resets to once per second to avoid performance issues
      const now = Date.now();
      if (now - lastActivityTime > 1000) {
        lastActivityTime = now;
        resetTimer();
      }
    };

    // Events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'wheel'];

    // Start timer
    resetTimer();

    // Add listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [currentUser, handleLogout]);

  return (
    <>
        {view === 'dashboard' && currentUser ? (
            <Dashboard 
                user={currentUser} 
                onLogout={handleLogout} 
                onUpdateUser={handleUserUpdate}
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme} 
            />
        ) : view === 'auth' ? (
            <AuthPage onLoginSuccess={handleLoginSuccess} onCancel={navigateToLanding} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        ) : (
            <LandingPage onGetStarted={navigateToAuth} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        )}

        {sessionTimedOut && (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20">
                <div className="bg-black text-white px-10 py-8 rounded-xl shadow-2xl flex flex-col items-center text-center max-w-md mx-4 animate-fade-in border border-gray-800">
                    <p className="text-lg font-medium mb-2">to protect your security, we logged you out.</p>
                    <button 
                        onClick={() => {
                            setSessionTimedOut(false);
                            setView('auth');
                        }}
                        className="text-yellow-400 hover:text-yellow-300 text-xl font-semibold underline underline-offset-4 transition-colors focus:outline-none"
                    >
                        sign in
                    </button>
                </div>
            </div>
        )}
         <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default App;
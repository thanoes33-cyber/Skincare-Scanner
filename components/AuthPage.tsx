
import React, { useState } from 'react';
import { LeafIcon } from './icons/LeafIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import type { User } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: User, rememberMe: boolean) => void;
  onCancel: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot' | 'reset-password';

interface LockoutData {
    attempts: number;
    lockedUntil?: number;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onCancel, isDarkMode, toggleTheme }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Password Validation Logic
  const checkPasswordStrength = (pass: string) => {
    return {
      length: pass.length >= 12,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      symbol: /[^a-zA-Z0-9]/.test(pass)
    };
  };

  const passwordReqs = checkPasswordStrength(password);
  const isPasswordValid = Object.values(passwordReqs).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    const cleanEmail = email.trim().toLowerCase();

    if (view === 'forgot') {
        if (!cleanEmail) {
            setError('Please enter your email address.');
            return;
        }
        setIsLoading(true);
        
        // Simulate network request
        setTimeout(() => {
            setIsLoading(false);
            // Check existence to simulate "sending to email on account"
            const storedUsers = JSON.parse(localStorage.getItem('skincare_users') || '[]');
            const userExists = storedUsers.some((u: any) => (u.email || '').trim().toLowerCase() === cleanEmail);
            
            if (userExists) {
                setSuccessMessage(`Password reset link sent to ${cleanEmail}. Please check your inbox.`);
            } else {
                 setSuccessMessage(`If an account exists for ${cleanEmail}, we have sent a password reset link to it.`);
            }
            setIsResetSent(true);
        }, 800);
        return;
    }

    // Handle actual Password Reset logic (Simulated Link Click)
    if (view === 'reset-password') {
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!isPasswordValid) {
            setError('Your password does not meet the security requirements.');
            return;
        }

        setIsLoading(true);
        
        setTimeout(() => {
            try {
                const storedUsers = JSON.parse(localStorage.getItem('skincare_users') || '[]');
                let userFound = false;
                const updatedUsers = storedUsers.map((u: any) => {
                    if ((u.email || '').trim().toLowerCase() === cleanEmail) {
                        userFound = true;
                        return { ...u, password: password };
                    }
                    return u;
                });

                if (userFound) {
                    localStorage.setItem('skincare_users', JSON.stringify(updatedUsers));
                }

                setIsLoading(false);
                setSuccessMessage('Your password has been successfully reset. Please sign in.');
                setView('login');
                setPassword('');
                setConfirmPassword('');
            } catch (err) {
                setIsLoading(false);
                setError('Failed to update password. Please try again.');
            }
        }, 800);
        return;
    }

    // Normalize inputs
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (view === 'signup' && (!cleanFirstName || !cleanLastName)) {
        setError('Please fill in your full name.');
        return;
    }

    // Validate Password for Sign Up
    if (view === 'signup' && !isPasswordValid) {
        setError('Your password does not meet the security requirements.');
        return;
    }

    setIsLoading(true);

    setTimeout(() => {
        try {
          const storedUsers = JSON.parse(localStorage.getItem('skincare_users') || '[]');

          if (view === 'login') {
            // 2. Check Credentials
            const user = storedUsers.find((u: any) => 
                u.email && u.email.trim().toLowerCase() === cleanEmail && u.password === password
            );

            if (user) {
              // Successful Login
              const userObj: User = {
                  email: user.email,
                  firstName: user.firstName || user.name?.split(' ')[0] || 'User',
                  lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
                  subscriptionStatus: user.subscriptionStatus || 'Active',
                  bio: user.bio || '',
                  photo: user.photo || '',
                  dateOfBirth: user.dateOfBirth,
              };
              setIsLoading(false);
              onLoginSuccess(userObj, rememberMe);
            } else {
              // Failed Login
              setIsLoading(false);
              setError(`Invalid credentials.`);
            }
          } else {
            // Sign Up Flow
            const existingUser = storedUsers.find((u: any) => (u.email || '').trim().toLowerCase() === cleanEmail);
            
            if (existingUser) {
              setIsLoading(false);
              setError('An account with this email already exists. Please log in.');
              return;
            }
            
            const newUser: any = { 
                email: cleanEmail, 
                password, 
                firstName: cleanFirstName,
                lastName: cleanLastName,
                subscriptionStatus: 'Active',
                bio: '',
                photo: '',
                name: `${cleanFirstName} ${cleanLastName}`
            };

            try {
                const updatedUsers = [...storedUsers, newUser];
                localStorage.setItem('skincare_users', JSON.stringify(updatedUsers));
                
                setIsLoading(false);
                const { password: _, name: __, ...userProfile } = newUser;
                // Use the rememberMe state selected by the user
                onLoginSuccess(userProfile as User, rememberMe);
            } catch (storageError) {
                setIsLoading(false);
                console.error("Storage Error:", storageError);
                setError("Failed to save account. Your device storage might be full.");
            }
          }
        } catch (err) {
          setIsLoading(false);
          console.error("Authentication Error:", err);
          setError("Unable to access local storage. Please enable cookies/storage.");
        }
    }, 800);
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <li className={`flex items-center text-xs transition-colors duration-200 ${met ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
      <span className={`mr-2 flex items-center justify-center w-4 h-4 rounded-full border ${met ? 'bg-green-100 border-green-500 dark:bg-green-900/50 dark:border-green-400' : 'border-gray-300 dark:border-gray-600'}`}>
         {met && <CheckCircleIcon className="w-3 h-3 text-green-600 dark:text-green-400" />}
      </span>
      {text}
    </li>
  );

  const getTitle = () => {
      switch (view) {
          case 'signup': return 'Create Account';
          case 'forgot': return 'Reset Password';
          case 'reset-password': return 'Set New Password';
          default: return 'Welcome Back';
      }
  };

  const getDescription = () => {
      switch (view) {
          case 'signup': return 'Join us to start tracking your skincare';
          case 'forgot': return 'Enter your email to receive a reset link';
          case 'reset-password': return 'Enter a new secure password for your account';
          default: return 'Sign in to access your dashboard';
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200 py-12">
      <div className="absolute top-4 right-4">
        <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full text-brand-gray-dark dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle dark mode"
        >
            {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </button>
      </div>

      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl transition-colors duration-200">
        
        {view === 'forgot' && isResetSent ? (
            <div className="text-center animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-6">
                    <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
                <p className="text-brand-gray dark:text-gray-300 mb-6 leading-relaxed">
                    {successMessage}
                </p>

                {/* Demo Link for Testing */}
                <div className="mb-8 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 animate-pulse">
                    <p className="text-xs text-blue-800 dark:text-blue-300 mb-1 font-bold uppercase tracking-wider">Developer Demo Mode</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                        (Since this is a demo app, we cannot send real emails.)
                        <br/>
                        <button 
                            onClick={() => {
                                setIsResetSent(false);
                                setView('reset-password');
                                setError('');
                                setSuccessMessage('');
                            }}
                            className="mt-2 inline-block underline font-bold hover:text-blue-800 dark:hover:text-blue-200 focus:outline-none"
                        >
                            Click here to simulate opening the reset link
                        </button>
                    </p>
                </div>

                <button
                    onClick={() => {
                        setView('login');
                        setIsResetSent(false);
                        setError('');
                        setSuccessMessage('');
                    }}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-brand-green hover:bg-brand-green-dark transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
                >
                    Back to Sign In
                </button>
            </div>
        ) : (
            <>
                <div className="text-center">
                  <LeafIcon className="mx-auto h-12 w-12 text-brand-green" />
                  <h2 className="mt-6 text-3xl font-extrabold text-brand-gray-dark dark:text-white">
                    {getTitle()}
                  </h2>
                  <p className="mt-2 text-sm text-brand-gray dark:text-gray-400">
                    {getDescription()}
                  </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                  <div className="rounded-md shadow-sm space-y-4">
                    {view === 'signup' && (
                      <div className="grid grid-cols-2 gap-4 animate-fade-in">
                        <div>
                          <label htmlFor="firstName" className="sr-only">First Name</label>
                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            autoComplete="given-name"
                            required
                            autoFocus
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="sr-only">Last Name</label>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            autoComplete="family-name"
                            required
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    
                    {view !== 'reset-password' && (
                        <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="username email"
                            autoFocus={view === 'login' || view === 'forgot'}
                            autoCapitalize="none"
                            autoCorrect="off"
                            required
                            className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        </div>
                    )}

                    {view !== 'forgot' && (
                        <div className="animate-fade-in space-y-4">
                            <div>
                                <label htmlFor="password" className="sr-only">{view === 'reset-password' ? 'New Password' : 'Password'}</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={view === 'login' ? "current-password" : "new-password"}
                                    autoFocus={view === 'reset-password'}
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                                    placeholder={view === 'reset-password' ? "New Password" : "Password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {view === 'reset-password' && (
                                <div>
                                    <label htmlFor="confirm-password" className="sr-only">Confirm New Password</label>
                                    <input
                                        id="confirm-password"
                                        name="confirmPassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Password Requirements Box */}
                    {(view === 'signup' || view === 'reset-password') && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 animate-fade-in">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wide mb-3">Password Requirements</h4>
                            <ul className="space-y-2">
                                <RequirementItem met={passwordReqs.length} text="At least 12 characters (aim for 12-15)" />
                                <RequirementItem met={passwordReqs.uppercase} text="One uppercase letter" />
                                <RequirementItem met={passwordReqs.lowercase} text="One lowercase letter" />
                                <RequirementItem met={passwordReqs.number} text="One number" />
                                <RequirementItem met={passwordReqs.symbol} text="One symbol (e.g., ! @ # $)" />
                            </ul>
                        </div>
                    )}

                    {/* Remember Me & Forgot Password Link */}
                    {(view === 'login' || view === 'signup') && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-brand-green focus:ring-brand-green border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300 cursor-pointer select-none">
                                    Remember me
                                </label>
                            </div>
                            {view === 'login' && (
                                <div className="text-sm">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setView('forgot');
                                            setError('');
                                            setSuccessMessage('');
                                        }}
                                        className="font-medium text-brand-green hover:text-brand-green-dark transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-100 dark:border-red-900/30 animate-fade-in">
                       <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                       <span>{error}</span>
                    </div>
                  )}

                  {/* Render success message here only if not in 'forgot' success view */}
                  {successMessage && !isResetSent && (
                    <div className="flex items-center gap-3 text-green-700 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-900/30 animate-fade-in">
                       <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                       <span>{successMessage}</span>
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-green hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={((view === 'signup' || view === 'reset-password') && !isPasswordValid) || isLoading}
                    >
                      {isLoading ? 'Processing...' : (view === 'login' ? 'Sign In' : (view === 'signup' ? 'Create Account' : (view === 'reset-password' ? 'Reset Password' : 'Send Reset Link')))}
                    </button>
                  </div>
                </form>
                
                <div className="flex flex-col items-center space-y-4 mt-6">
                    {view === 'forgot' || view === 'reset-password' ? (
                         <button
                            onClick={() => {
                                setView('login');
                                setError('');
                                setSuccessMessage('');
                                setPassword('');
                                setConfirmPassword('');
                            }}
                            className="text-sm font-medium text-brand-gray dark:text-gray-400 hover:text-brand-gray-dark dark:hover:text-gray-200 transition-colors"
                        >
                            Back to Sign In
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                setView(view === 'login' ? 'signup' : 'login');
                                setError('');
                                setSuccessMessage('');
                                setPassword('');
                                if (view === 'login') {
                                    setFirstName('');
                                    setLastName('');
                                }
                            }}
                            className="text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
                        >
                            {view === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    )}
                    
                    <button
                        onClick={onCancel}
                        className="text-xs text-brand-gray dark:text-gray-400 hover:text-brand-gray-dark dark:hover:text-gray-200 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </>
        )}
      </div>
      <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
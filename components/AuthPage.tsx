
import React, { useState } from 'react';
import { LeafIcon } from './icons/LeafIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import type { User } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onCancel: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onCancel, isDarkMode, toggleTheme }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('skincare_users') || '[]');

    if (isLogin) {
      const user = storedUsers.find((u: any) => u.email === email && u.password === password);
      if (user) {
        onLoginSuccess({ email: user.email, name: user.name });
      } else {
        setError('Invalid email or password.');
      }
    } else {
      if (storedUsers.find((u: any) => u.email === email)) {
        setError('User already exists. Please log in.');
        return;
      }
      const newUser = { email, password, name };
      localStorage.setItem('skincare_users', JSON.stringify([...storedUsers, newUser]));
      onLoginSuccess({ email: newUser.email, name: newUser.name });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
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
        <div className="text-center">
          <LeafIcon className="mx-auto h-12 w-12 text-brand-green" />
          <h2 className="mt-6 text-3xl font-extrabold text-brand-gray-dark dark:text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mt-2 text-sm text-brand-gray dark:text-gray-400">
            {isLogin ? 'Sign in to access your dashboard' : 'Join us to start tracking your skincare'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-brand-green focus:border-brand-green focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-md">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-green hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
        
        <div className="flex flex-col items-center space-y-4">
            <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-brand-green hover:text-brand-green-dark transition-colors"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
            <button
                onClick={onCancel}
                className="text-xs text-brand-gray dark:text-gray-400 hover:text-brand-gray-dark dark:hover:text-gray-200 transition-colors"
            >
                Back to Home
            </button>
        </div>
      </div>
    </div>
  );
};

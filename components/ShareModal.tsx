
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { LinkIcon } from './icons/LinkIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShareIcon } from './icons/ShareIcon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    title: string;
    text: string;
    url: string;
  };
}

// Inline Social Icons
const FacebookIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
);
const XIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
);
const InstagramIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
);
const GmailIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" /></svg>
);
const YahooIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" className="w-6 h-6"><path d="M22.4 6.1l-6.9 15.6h-3.1l2.3-5.1-6.4-10.6h3.4l4.5 7.9 4.2-7.9h2z"/></svg>
);

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data }) => {
  const [copied, setCopied] = useState(false);
  const [canShareNative, setCanShareNative] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanShareNative(true);
    }
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(data.url);
  const encodedText = encodeURIComponent(data.text);
  const encodedTitle = encodeURIComponent(data.title);
  const fullBody = `${encodedText}%0A%0A${encodedUrl}`;

  const handleCopyLink = async () => {
    try {
      const shareText = `${data.text}\n\n${data.url}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };
  
  const handleCopyForInstagram = async () => {
      try {
        const shareText = `${data.text}\n\n${data.url}`;
        await navigator.clipboard.writeText(shareText);
        setToastMessage('Copied to clipboard! Open Instagram to paste.');
        setTimeout(() => setToastMessage(''), 3000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
  };

  const handleNativeShare = async () => {
      try {
          await navigator.share({
              title: data.title,
              text: data.text,
              url: data.url
          });
          onClose();
      } catch(e) {
          console.log("Share cancelled or failed", e);
      }
  };

  const shareLinks = [
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      color: 'bg-blue-600 hover:bg-blue-700',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      onClick: undefined
    },
    {
      name: 'X',
      icon: <XIcon />,
      color: 'bg-black hover:bg-gray-800',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      onClick: undefined
    },
    {
        name: 'Gmail',
        icon: <GmailIcon />,
        color: 'bg-red-500 hover:bg-red-600',
        href: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${fullBody}`,
        onClick: undefined
    },
    {
        name: 'Yahoo',
        icon: <YahooIcon />,
        color: 'bg-purple-600 hover:bg-purple-700',
        href: `http://compose.mail.yahoo.com/?subject=${encodedTitle}&body=${fullBody}`,
        onClick: undefined
    },
    {
        name: 'Instagram',
        icon: <InstagramIcon />,
        color: 'bg-gradient-to-br from-purple-600 to-orange-500 hover:opacity-90',
        href: undefined, // Web share to IG not possible via link
        onClick: handleCopyForInstagram
    }
  ];

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Share Analysis</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
            {shareLinks.map((link) => (
                <div key={link.name} className="flex flex-col items-center gap-2">
                    {link.href ? (
                        <a 
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-12 h-12 flex items-center justify-center rounded-full text-white transition-transform transform hover:scale-110 shadow-md ${link.color}`}
                            title={`Share to ${link.name}`}
                        >
                            {link.icon}
                        </a>
                    ) : (
                        <button
                            onClick={link.onClick}
                            className={`w-12 h-12 flex items-center justify-center rounded-full text-white transition-transform transform hover:scale-110 shadow-md ${link.color}`}
                            title={`Share to ${link.name}`}
                        >
                             {link.icon}
                        </button>
                    )}
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{link.name}</span>
                </div>
            ))}
        </div>

        <div className="space-y-3">
            <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors group"
            >
                <div className="flex items-center">
                    <LinkIcon className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400 group-hover:text-brand-green" />
                    <span className="text-sm font-medium">Copy Link & Summary</span>
                </div>
                {copied ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : null}
            </button>

            {canShareNative && (
                <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center p-3 rounded-xl bg-brand-green/10 text-brand-green font-semibold hover:bg-brand-green hover:text-white transition-all"
                >
                    <ShareIcon className="w-5 h-5 mr-2" />
                    More Options...
                </button>
            )}
        </div>
        
        {toastMessage && (
            <div className="absolute bottom-2 left-0 w-full flex justify-center pointer-events-none">
                <div className="bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md shadow-lg animate-slide-up">
                    {toastMessage}
                </div>
            </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

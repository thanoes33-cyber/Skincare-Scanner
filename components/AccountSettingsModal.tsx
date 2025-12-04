
import React, { useState, useRef } from 'react';
import type { User } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CameraIcon } from './icons/CameraIcon';
import { Spinner } from './Spinner';

interface AccountSettingsModalProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState<User>(user);
  const [previewPhoto, setPreviewPhoto] = useState<string | undefined>(user.photo);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'bio' && value.length > 150) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Compress image to avoid hitting localStorage limits
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400; // Resize to safe width for localStorage
            const scale = MAX_WIDTH / img.width;
            
            // Only resize if it's bigger than max width
            const width = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
            const height = img.width > MAX_WIDTH ? img.height * scale : img.height;

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Compress quality to 0.8
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            setPreviewPhoto(optimizedDataUrl);
            setFormData(prev => ({ ...prev, photo: optimizedDataUrl }));
            setIsProcessing(false);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Photo Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group cursor-pointer" onClick={() => !isProcessing && fileInputRef.current?.click()}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg bg-gray-100 dark:bg-gray-600 relative">
                {isProcessing ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Spinner className="w-8 h-8 text-white" />
                    </div>
                ) : previewPhoto ? (
                  <img src={previewPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserCircleIcon className="w-20 h-20" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-brand-green hover:text-brand-green-dark">
              {isProcessing ? 'Processing...' : 'Change Photo'}
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-green focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-green focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed as it is your account ID.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
                autoComplete="bday"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-green focus:outline-none"
              />
            </div>
             <div className="md:col-span-2">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Bio</label>
                <span className={`text-xs ${formData.bio && formData.bio.length >= 150 ? 'text-red-500' : 'text-gray-500'}`}>
                  {formData.bio?.length || 0}/150
                </span>
              </div>
              <textarea
                name="bio"
                rows={3}
                value={formData.bio || ''}
                onChange={handleChange}
                placeholder="Tell us a bit about yourself..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-green focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 text-sm font-bold text-white bg-brand-green rounded-lg hover:bg-brand-green-dark shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
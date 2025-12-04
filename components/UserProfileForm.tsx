
import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { SKIN_TYPES, SKIN_CONCERNS, SENSITIVITY_LEVELS } from '../constants';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface UserProfileFormProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ userProfile, setUserProfile }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(userProfile);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [newSensitivity, setNewSensitivity] = useState({ ingredient: '', level: 'moderate' as 'high' | 'moderate' });
  
  useEffect(() => {
    // Sync local state if the prop changes from parent
    setLocalProfile(userProfile);
  }, [userProfile]);

  const hasChanges = JSON.stringify(localProfile) !== JSON.stringify(userProfile);

  const handleSave = () => {
    setUserProfile(localProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConcernToggle = (concern: string) => {
    setLocalProfile(prev => {
      const newConcerns = prev.skinConcerns.includes(concern)
        ? prev.skinConcerns.filter(c => c !== concern)
        : [...prev.skinConcerns, concern];
      return { ...prev, skinConcerns: newConcerns };
    });
  };

  const handleAddSensitivity = () => {
    if (!newSensitivity.ingredient.trim()) return;
    const ingredientKey = newSensitivity.ingredient.trim().toLowerCase();
    setLocalProfile(prev => ({
        ...prev,
        ingredientSensitivities: {
            ...prev.ingredientSensitivities,
            [ingredientKey]: newSensitivity.level,
        }
    }));
    setNewSensitivity({ ingredient: '', level: 'moderate' });
  };

  const handleRemoveSensitivity = (ingredientKey: string) => {
    setLocalProfile(prev => {
        const newSensitivities = { ...prev.ingredientSensitivities };
        delete newSensitivities[ingredientKey];
        return { ...prev, ingredientSensitivities: newSensitivities };
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200">
      <div className="flex items-center mb-4">
        <UserCircleIcon className="h-8 w-8 text-brand-green" />
        <h2 className="text-xl font-bold text-brand-gray-dark dark:text-white ml-3">Your Skin Profile</h2>
      </div>
      <p className="text-brand-gray dark:text-gray-400 mb-6">Personalize the analysis based on your skin. Your profile is saved automatically when you click save.</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-brand-gray-dark dark:text-gray-300 mb-2">Skin Type</label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setLocalProfile(p => ({ ...p, skinType: type }))}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 border flex-shrink-0 whitespace-nowrap ${
                  localProfile.skinType === type
                    ? 'bg-brand-green text-white border-brand-green shadow'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-brand-gray-dark dark:text-gray-300 hover:border-brand-green hover:text-brand-green'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-gray-dark dark:text-gray-300 mb-2">Skin Concerns</label>
          <div className="flex flex-wrap gap-2">
            {SKIN_CONCERNS.map(concern => (
              <button
                key={concern}
                onClick={() => handleConcernToggle(concern)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 border flex-shrink-0 whitespace-nowrap ${
                  localProfile.skinConcerns.includes(concern)
                    ? 'bg-brand-green text-white border-brand-green shadow'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-brand-gray-dark dark:text-gray-300 hover:border-brand-green hover:text-brand-green'
                }`}
              >
                {concern}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-brand-gray-dark dark:text-gray-300 mb-2">Ingredient Sensitivities</label>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-colors duration-200">
            {/* Improved layout for responsiveness */}
            <div className="flex flex-col md:flex-row gap-3">
              <input 
                type="text"
                placeholder="e.g., Linalool"
                value={newSensitivity.ingredient}
                onChange={e => setNewSensitivity(p => ({...p, ingredient: e.target.value}))}
                className="flex-grow px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent transition min-w-[120px]"
              />
              
              <div className="flex items-center gap-2 flex-shrink-0">
                 <div className="flex gap-1 bg-white dark:bg-gray-600 p-1 rounded-lg border border-gray-200 dark:border-gray-500">
                    {(Object.keys(SENSITIVITY_LEVELS) as Array<'high' | 'moderate'>).map(level => (
                      <button 
                        key={level} 
                        onClick={() => setNewSensitivity(p => ({...p, level}))} 
                        className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap rounded-md transition-all ${
                            newSensitivity.level === level 
                            ? 'bg-brand-green text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                        }`}
                      >
                        {level === 'high' ? 'High' : 'Mod'}
                      </button>
                    ))}
                 </div>
                 <button 
                    onClick={handleAddSensitivity} 
                    disabled={!newSensitivity.ingredient.trim()}
                    className="px-4 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
                 >
                    Add
                 </button>
              </div>
            </div>

             <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(localProfile.ingredientSensitivities || {}).map(([key, value]) => (
                <span key={key} className={`flex items-center text-xs font-medium pl-3 pr-2 py-1 rounded-full ${value === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'}`}>
                  {key}
                  <button onClick={() => handleRemoveSensitivity(key)} className="ml-1.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="health-conditions" className="block text-sm font-semibold text-brand-gray-dark dark:text-gray-300 mb-2">
            Allergies or Health Conditions
          </label>
          <textarea
            id="health-conditions"
            rows={3}
            value={localProfile.healthConditions}
            onChange={(e) => setLocalProfile(p => ({ ...p, healthConditions: e.target.value }))}
            placeholder="e.g., Nut allergy, Eczema, Rosacea"
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent transition"
          />
        </div>
        
        <div className="mt-6">
            <button
                onClick={handleSave}
                disabled={!hasChanges || isSaved}
                className={`w-full flex items-center justify-center font-bold py-3 px-4 rounded-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${!hasChanges && !isSaved ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''}
                    ${hasChanges && !isSaved ? 'bg-brand-green text-white hover:bg-brand-green-dark focus:ring-brand-green hover:scale-105' : ''}
                    ${isSaved ? 'bg-green-500 text-white focus:ring-green-500' : ''}
                `}
            >
                {isSaved ? (
                    <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Saved!
                    </>
                ) : (
                    'Save Profile'
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

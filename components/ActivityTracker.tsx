
import React, { useState, useMemo } from 'react';
import type { ActivityItem } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { LeafIcon } from './icons/LeafIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface ActivityTrackerProps {
  activities: ActivityItem[];
  onAddActivity: (item: Omit<ActivityItem, 'id'>) => void;
  onDeleteActivity: (id: string) => void;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ activities, onAddActivity, onDeleteActivity }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    details: '',
    time: new Date().toTimeString().slice(0, 5),
    duration: '0',
  });

  // Sort activities by timestamp (newest first) and filter for "Today" generally, 
  // though for this MVP we just show list sorted descending.
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.timestamp - a.timestamp);
  }, [activities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title.trim()) return;

    const today = new Date();
    const [hours, minutes] = newActivity.time.split(':').map(Number);
    today.setHours(hours, minutes, 0, 0);

    onAddActivity({
      type: 'routine',
      title: newActivity.title,
      details: newActivity.details,
      timestamp: today.getTime(),
      durationMinutes: parseInt(newActivity.duration) || 0,
    });

    setNewActivity({ title: '', details: '', time: new Date().toTimeString().slice(0, 5), duration: '0' });
    setIsAdding(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEndTime = (timestamp: number, duration: number) => {
      if (!duration) return null;
      const end = new Date(timestamp + duration * 60000);
      return formatTime(end.getTime());
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClockIcon className="h-7 w-7 text-brand-green" />
          <h2 className="text-xl font-bold text-brand-gray-dark dark:text-white ml-3">Daily Activity Log</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-brand-gray-dark dark:text-white hover:bg-brand-green hover:text-white transition-colors"
          title="Add Activity"
        >
          {isAdding ? <div className="h-5 w-5 flex items-center justify-center font-bold text-lg leading-none">×</div> : <PencilSquareIcon className="h-5 w-5" />}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 animate-fade-in">
          <div className="space-y-3">
            <div>
                <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Activity / Note</label>
                <input
                    type="text"
                    placeholder="e.g., Morning Routine, Drank Water"
                    value={newActivity.title}
                    onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Details (Optional)</label>
                <input
                    type="text"
                    placeholder="Additional notes..."
                    value={newActivity.details}
                    onChange={e => setNewActivity({...newActivity, details: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                />
            </div>
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Start Time</label>
                    <input
                        type="time"
                        value={newActivity.time}
                        onChange={e => setNewActivity({...newActivity, time: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                    />
                </div>
                <div className="flex-1">
                     <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Duration (min)</label>
                    <input
                        type="number"
                        min="0"
                        value={newActivity.duration}
                        onChange={e => setNewActivity({...newActivity, duration: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                    />
                </div>
            </div>
            <button
                type="submit"
                className="w-full mt-2 bg-brand-green text-white font-bold py-2 rounded-lg text-sm hover:bg-brand-green-dark transition-colors"
            >
                Add Log
            </button>
          </div>
        </form>
      )}

      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        {sortedActivities.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
                <p className="text-sm">No activities logged today.</p>
            </div>
        ) : (
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent dark:before:via-gray-700">
                {sortedActivities.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        {/* Icon Bubble */}
                        <div className="absolute left-0 md:static flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 shrink-0 md:mx-4 z-10">
                            {item.type === 'scan' ? (
                                <LeafIcon className="w-5 h-5 text-green-500" />
                            ) : (
                                <PencilSquareIcon className="w-5 h-5 text-blue-500" />
                            )}
                        </div>

                        {/* Content Card */}
                        <div className="ml-14 md:ml-0 w-full bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start">
                                <div>
                                    <span className="flex items-center gap-2 text-xs font-bold tracking-wide text-gray-400 uppercase">
                                        {formatTime(item.timestamp)}
                                        {item.durationMinutes ? ` - ${getEndTime(item.timestamp, item.durationMinutes)}` : ''}
                                    </span>
                                    <h3 className="text-base font-bold text-brand-gray-dark dark:text-white mt-1 leading-tight">
                                        {item.title}
                                    </h3>
                                    {item.type === 'scan' && (
                                         <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            Scan Reading
                                         </span>
                                    )}
                                    {item.details && (
                                        <p className="mt-2 text-sm text-brand-gray dark:text-gray-300">
                                            {item.details}
                                        </p>
                                    )}
                                    {item.durationMinutes ? (
                                         <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                                             <ClockIcon className="w-3 h-3 mr-1" />
                                             {item.durationMinutes} min duration
                                         </div>
                                    ) : null}
                                </div>
                                <button 
                                    onClick={() => onDeleteActivity(item.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    title="Remove"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                </button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

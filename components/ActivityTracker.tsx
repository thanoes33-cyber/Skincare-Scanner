
import React, { useState, useMemo, useEffect } from 'react';
import type { ActivityItem } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { LeafIcon } from './icons/LeafIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ActivityTrackerProps {
  activities: ActivityItem[];
  onAddActivity: (item: Omit<ActivityItem, 'id'>) => void;
  onEditActivity: (item: ActivityItem) => void;
  onDeleteActivity: (id: string) => void;
}

export const ActivityTracker: React.FC<ActivityTrackerProps> = ({ activities, onAddActivity, onEditActivity, onDeleteActivity }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newActivity, setNewActivity] = useState({
    title: '',
    details: '',
    time: new Date().toTimeString().slice(0, 5),
    duration: '0',
  });

  const [editForm, setEditForm] = useState<{
      id: string;
      title: string;
      details: string;
      date: string; // YYYY-MM-DD
      time: string; // HH:MM
      duration: string;
  } | null>(null);

  // Sort activities by timestamp (newest first)
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

  const handleEditClick = (item: ActivityItem) => {
    const dateObj = new Date(item.timestamp);
    // Format date for input type="date" (YYYY-MM-DD)
    const dateStr = dateObj.getFullYear() + '-' + 
                   String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(dateObj.getDate()).padStart(2, '0');
    // Format time for input type="time" (HH:MM)
    const timeStr = String(dateObj.getHours()).padStart(2, '0') + ':' + 
                    String(dateObj.getMinutes()).padStart(2, '0');

    setEditForm({
        id: item.id,
        title: item.title,
        details: item.details || '',
        date: dateStr,
        time: timeStr,
        duration: (item.durationMinutes || 0).toString()
    });
    setEditingId(item.id);
  };

  const handleEditSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editForm) return;

      // Reconstruct timestamp from date and time inputs
      const dateTimeStr = `${editForm.date}T${editForm.time}`;
      const timestamp = new Date(dateTimeStr).getTime();

      if (isNaN(timestamp)) {
          alert("Invalid date or time");
          return;
      }

      const original = activities.find(a => a.id === editForm.id);
      if (!original) return;

      const updatedItem: ActivityItem = {
          ...original,
          title: editForm.title,
          details: editForm.details,
          timestamp: timestamp,
          durationMinutes: parseInt(editForm.duration) || 0
      };

      onEditActivity(updatedItem);
      setEditingId(null);
      setEditForm(null);
  };

  const handleDeleteClick = (id: string) => {
      if(window.confirm("Are you sure you want to delete this activity log?")) {
          onDeleteActivity(id);
      }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getEndTime = (timestamp: number, duration: number) => {
      if (!duration) return null;
      const end = new Date(timestamp + duration * 60000);
      return formatTime(end.getTime());
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg transition-colors duration-200 h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ClockIcon className="h-7 w-7 text-brand-green" />
          <h2 className="text-xl font-bold text-brand-gray-dark dark:text-white ml-3">Activity Log</h2>
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
                                        {formatDate(item.timestamp)} • {formatTime(item.timestamp)}
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
                                <div className="flex flex-col gap-1">
                                    <button 
                                        onClick={() => handleEditClick(item)}
                                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClick(item.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Edit Modal Overlay */}
      {editingId && editForm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 z-20 flex flex-col p-6 rounded-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-brand-gray-dark dark:text-white">Edit Activity</h3>
                  <button onClick={() => { setEditingId(null); setEditForm(null); }} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                      <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
              </div>
              <form onSubmit={handleEditSave} className="space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-1">
                    <div>
                        <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Details</label>
                        <textarea
                            rows={3}
                            value={editForm.details}
                            onChange={e => setEditForm({...editForm, details: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                             <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Date</label>
                             <input
                                type="date"
                                value={editForm.date}
                                onChange={e => setEditForm({...editForm, date: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                             />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Time</label>
                            <input
                                type="time"
                                value={editForm.time}
                                onChange={e => setEditForm({...editForm, time: e.target.value})}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                         <label className="block text-xs font-semibold text-brand-gray dark:text-gray-400 mb-1">Duration (min)</label>
                         <input
                            type="number"
                            min="0"
                            value={editForm.duration}
                            onChange={e => setEditForm({...editForm, duration: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:ring-1 focus:ring-brand-green focus:outline-none"
                         />
                    </div>
                    <div className="pt-2 flex gap-3">
                        <button 
                            type="button"
                            onClick={() => { setEditingId(null); setEditForm(null); }}
                            className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2 rounded-lg bg-brand-green text-white font-bold text-sm hover:bg-brand-green-dark transition"
                        >
                            Save Changes
                        </button>
                    </div>
              </form>
          </div>
      )}
    </div>
  );
};

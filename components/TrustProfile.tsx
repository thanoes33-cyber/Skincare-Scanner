import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, CheckCircle2, ShieldCheck, Award, Link as LinkIcon, 
  MessageSquare, Share2, UserPlus, Shield, Eye, Lock, Globe, 
  Smartphone, Key, Moon, Sun, Monitor, Bell, Mail, MessageCircle, 
  CreditCard, Power, Download, Trash2, GripVertical, Image as ImageIcon,
  HelpCircle, ChevronRight, Activity, DollarSign, BarChart3, Database
} from 'lucide-react';

// Tooltip Component
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50 text-center pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const TrustProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isProMode, setIsProMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Navigation / Tabs */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto hide-scrollbar">
            {['profile', 'privacy', 'security', 'experience', 'notifications', 'integrations', 'transparency'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Core Profile Header */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
             <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm font-medium">
                <ShieldCheck className="w-4 h-4" />
                Trust Score: 98/100
             </div>
          </div>
          
          <div className="px-6 sm:px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="relative group">
                <Tooltip content="Approachability Guidelines: Use a clear, well-lit headshot. Smile naturally. Avoid sunglasses or distracting backgrounds.">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                    <img src="https://picsum.photos/seed/avatar/200/200" alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Tooltip>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-800" title="Identity Verified">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  <UserPlus className="w-4 h-4" /> Connect
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors">
                  <MessageSquare className="w-4 h-4" /> Message
                </button>
                <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Alex Rivera</h1>
                  <div className="flex gap-1">
                    <Tooltip content="Identity Verified via Government ID">
                      <ShieldCheck className="w-5 h-5 text-blue-500" />
                    </Tooltip>
                    <Tooltip content="Professional Credentials Verified">
                      <Award className="w-5 h-5 text-purple-500" />
                    </Tooltip>
                  </div>
                </div>
                
                <div className="relative group">
                  <input 
                    type="text" 
                    defaultValue="Senior UX Architect & Product Strategist | Building Trust-First Platforms"
                    className="w-full text-lg text-gray-600 dark:text-gray-300 bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-blue-500 focus:outline-none transition-colors py-1"
                  />
                  <div className="absolute right-0 top-full mt-1 text-xs text-green-600 dark:text-green-400 opacity-0 group-focus-within:opacity-100 transition-opacity flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Keyword optimization: Strong
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <LinkIcon className="w-4 h-4" /> alexrivera.design
                  <CheckCircle2 className="w-3 h-3 text-green-500 ml-0.5" title="Verified Domain" />
                </a>
                <a href="#" className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <Mail className="w-4 h-4" /> Contact Email
                  <CheckCircle2 className="w-3 h-3 text-green-500 ml-0.5" title="Verified Email" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Content based on Tabs */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Professional Mode Toggle */}
                <section className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      Professional Mode
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                      Unlock analytics, monetization tools, and public skill endorsements.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isProMode} onChange={() => setIsProMode(!isProMode)} />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </section>

                {/* Featured Content Gallery */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-gray-500" /> Featured Content
                    </h2>
                    <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Add New</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="group relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-grab active:cursor-grabbing">
                        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 p-1 rounded backdrop-blur-sm">
                          <GripVertical className="w-4 h-4 text-gray-500" />
                        </div>
                        <img src={`https://picsum.photos/seed/portfolio${item}/400/300`} alt="Portfolio item" className="w-full h-40 object-cover" />
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Case Study: Trust UI</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Redesigning privacy controls for 2M+ users.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Eye className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy & Identity</h2>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-8 border border-blue-100 dark:border-blue-800/30">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Plain English Summary
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                      Currently, your <strong>Name</strong>, <strong>Headline</strong>, and <strong>Featured Content</strong> are visible to everyone on the internet. Your <strong>Contact Links</strong> are only visible to your connections. Your <strong>Email Address</strong> is strictly private.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Visibility Toggles */}
                    {[
                      { label: 'Profile Photo & Headline', value: 'Public' },
                      { label: 'Contact Information', value: 'Connections Only' },
                      { label: 'Activity Feed', value: 'Private' }
                    ].map((setting, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{setting.label}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control who can see this information.</p>
                        </div>
                        <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-auto p-2.5">
                          <option value="public" selected={setting.value === 'Public'}>Public</option>
                          <option value="connections" selected={setting.value === 'Connections Only'}>Connections Only</option>
                          <option value="private" selected={setting.value === 'Private'}>Private (Only Me)</option>
                        </select>
                      </div>
                    ))}

                    {/* Custom URL */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">Custom URL Slug</h4>
                        <Tooltip content="This is your unique profile address on the platform.">
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                        </Tooltip>
                      </div>
                      <div className="flex mt-1">
                        <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                          trust.app/
                        </span>
                        <input type="text" defaultValue="alexrivera" className="rounded-none rounded-r-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 block flex-1 min-w-0 w-full text-sm p-2.5" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Shield className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
                  </div>

                  <div className="space-y-8">
                    {/* Password Health */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Password Health</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 w-full"></div>
                        </div>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">Excellent</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last changed 4 months ago. <button className="text-blue-600 hover:underline">Update password</button></p>
                    </div>

                    {/* 2FA */}
                    <div className="flex items-start justify-between gap-4 py-6 border-y border-gray-100 dark:border-gray-700">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <Key className="w-4 h-4" /> Two-Factor Authentication (2FA)
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add an extra layer of security to your account using an authenticator app.</p>
                      </div>
                      <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                        Enabled
                      </span>
                    </div>

                    {/* Active Sessions */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white">Active Sessions</h4>
                        <button className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Logout All Devices</button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                          <Monitor className="w-6 h-6 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Mac OS • Safari</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">San Francisco, CA • Current Session</p>
                          </div>
                          <span className="text-xs text-green-600 font-medium">Active now</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                          <Smartphone className="w-6 h-6 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">iPhone 14 Pro • App</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">San Francisco, CA • Last active 2 hours ago</p>
                          </div>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Power className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'transparency' && (
              <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Database className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transparency Dashboard</h2>
                    </div>
                    <Tooltip content="We log every time a 3rd party or internal system accesses your data.">
                      <HelpCircle className="w-5 h-5 text-gray-400" />
                    </Tooltip>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    A complete, immutable log of who accessed your data, when, and for what purpose. You own your data.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" className="px-4 py-3 rounded-l-lg">Date & Time</th>
                          <th scope="col" className="px-4 py-3">Accessor</th>
                          <th scope="col" className="px-4 py-3">Data Accessed</th>
                          <th scope="col" className="px-4 py-3 rounded-r-lg">Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                          <td className="px-4 py-3">Today, 10:42 AM</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Stripe (Integration)</td>
                          <td className="px-4 py-3">Billing History</td>
                          <td className="px-4 py-3">Subscription Renewal</td>
                        </tr>
                        <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                          <td className="px-4 py-3">Yesterday, 3:15 PM</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Internal Search Indexer</td>
                          <td className="px-4 py-3">Public Profile</td>
                          <td className="px-4 py-3">Search Discoverability</td>
                        </tr>
                        <tr className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3">Mar 28, 9:00 AM</td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Google Auth</td>
                          <td className="px-4 py-3">Email Address</td>
                          <td className="px-4 py-3">SSO Login</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Data Portability & Ownership</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <Download className="w-6 h-6 text-blue-600 mb-3" />
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">Download My Data</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get a complete copy of your profile, connections, and activity in JSON or CSV format.</p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">JSON</button>
                        <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">CSV</button>
                      </div>
                    </div>
                    
                    <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                      <Trash2 className="w-6 h-6 text-red-600 mb-3" />
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1">Permanent Deletion</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Erase your account and all associated data permanently. Zero human intervention required.</p>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Monitor className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Experience</h2>
                  </div>

                  <div className="space-y-8">
                    {/* Theme Selection */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Theme Preference</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {['Light', 'Dark', 'System Default'].map((theme, idx) => (
                          <button key={theme} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-colors ${idx === 0 ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            {idx === 0 ? <Sun className="w-6 h-6" /> : idx === 1 ? <Moon className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                            <span className="text-sm font-medium">{theme}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Scaling */}
                    <div className="py-6 border-y border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Font Scaling</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Adjust the text size across the platform.</p>
                        </div>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">100%</span>
                      </div>
                      <input type="range" min="80" max="150" defaultValue="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600" />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>Smaller (80%)</span>
                        <span>Default (100%)</span>
                        <span>Larger (150%)</span>
                      </div>
                    </div>

                    {/* Localization */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Language</label>
                        <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                          <option>English (US)</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Currency</label>
                        <select className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                          <option>USD ($)</option>
                          <option>EUR (€)</option>
                          <option>GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
                  </div>

                  {/* Frequency Matrix */}
                  <div className="mb-8 overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th scope="col" className="px-4 py-3 rounded-l-lg">Event Type</th>
                          <th scope="col" className="px-4 py-3 text-center">Email</th>
                          <th scope="col" className="px-4 py-3 text-center">Push</th>
                          <th scope="col" className="px-4 py-3 text-center rounded-r-lg">SMS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Direct Messages', email: true, push: true, sms: false },
                          { name: 'Connection Requests', email: true, push: false, sms: false },
                          { name: 'Profile Views', email: false, push: false, sms: false },
                          { name: 'Security Alerts', email: true, push: true, sms: true }
                        ].map((row, idx) => (
                          <tr key={idx} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 last:border-0">
                            <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{row.name}</td>
                            <td className="px-4 py-4 text-center"><input type="checkbox" defaultChecked={row.email} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /></td>
                            <td className="px-4 py-4 text-center"><input type="checkbox" defaultChecked={row.push} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /></td>
                            <td className="px-4 py-4 text-center"><input type="checkbox" defaultChecked={row.sms} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Quiet Hours */}
                  <div className="p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30 bg-indigo-50 dark:bg-indigo-900/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                          <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Global Quiet Hours
                        </h4>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1 mb-4">Pause all non-critical notifications during these hours.</p>
                        
                        <div className="flex items-center gap-3">
                          <input type="time" defaultValue="22:00" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2" />
                          <span className="text-gray-500">to</span>
                          <input type="time" defaultValue="07:00" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2" />
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Globe className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">3rd Party Permissions</h2>
                    </div>
                    <button className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">Revoke All</button>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Google Calendar', access: 'Read/Write Events', date: 'Authorized Mar 15, 2026' },
                      { name: 'Slack', access: 'Post Messages', date: 'Authorized Jan 10, 2026' }
                    ].map((app, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{app.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{app.access} • {app.date}</p>
                          </div>
                        </div>
                        <button className="text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium transition-colors">Revoke</button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing & Subscriptions</h2>
                  </div>

                  <div className="p-5 rounded-xl border border-green-200 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 mb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-green-900 dark:text-green-100 flex items-center gap-2">
                          <Award className="w-5 h-5 text-green-600 dark:text-green-400" /> Pro Plan Active
                        </h4>
                        <p className="text-sm text-green-800 dark:text-green-200 mt-1">$15.00/month. Next billing date: April 15, 2026.</p>
                      </div>
                      <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800 rounded-lg text-sm font-medium transition-colors">
                        One-Click Cancel
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Billing History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th scope="col" className="px-4 py-3 rounded-l-lg">Date</th>
                            <th scope="col" className="px-4 py-3">Description</th>
                            <th scope="col" className="px-4 py-3">Amount</th>
                            <th scope="col" className="px-4 py-3 rounded-r-lg">Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                            <td className="px-4 py-3">Mar 15, 2026</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Pro Plan (Monthly)</td>
                            <td className="px-4 py-3">$15.00</td>
                            <td className="px-4 py-3"><button className="text-blue-600 hover:underline">Download</button></td>
                          </tr>
                          <tr className="bg-white dark:bg-gray-800">
                            <td className="px-4 py-3">Feb 15, 2026</td>
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Pro Plan (Monthly)</td>
                            <td className="px-4 py-3">$15.00</td>
                            <td className="px-4 py-3"><button className="text-blue-600 hover:underline">Download</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

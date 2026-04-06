
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Chat, Content } from "@google/genai";
import { UserProfile } from '../types';
import { createChatSession, generateSpeech, decode, decodeAudioData } from '../services/geminiService';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Spinner } from './Spinner';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { AudioSparkIcon } from './icons/AudioSparkIcon';
import { BoltIcon } from './icons/BoltIcon';

interface ChatBotProps {
  userProfile: UserProfile;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: "Hi! I'm your AI Expert Consultant. Ask me anything about your skin, food ingredients, or health routine!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const { playClick, playSuccess, announce } = useAccessibility();

  // Convert internal messages to SDK history format
  const getHistoryForSDK = (msgList: Message[]): Content[] => {
    return msgList
      .filter(m => m.id !== 'init') 
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
  };

  // Sync session with profile and history
  useEffect(() => {
    try {
        chatSessionRef.current = createChatSession(userProfile, getHistoryForSDK(messages));
    } catch (e) {
        console.error("Failed to init chat", e);
    }
    return () => stopAudio();
  }, [userProfile]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    setSpeakingMessageId(null);
  };

  const clearHistory = () => {
      setConfirmModal(true);
  };

  const confirmClear = () => {
      setMessages([{ id: 'init', role: 'model', text: "Chat history cleared. How can I help you today?" }]);
      chatSessionRef.current = createChatSession(userProfile);
      playClick();
      announce("Chat history cleared");
      setConfirmModal(false);
  };

  const cancelClear = () => {
      setConfirmModal(false);
  };

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
      if (isOpen) {
          setTimeout(() => {
              inputRef.current?.focus();
          }, 100);
      }
  }, [isOpen]);

  const toggleChat = () => {
      playClick();
      setIsOpen(!isOpen);
      if (!isOpen) {
          announce("Chat opened");
      } else {
          announce("Chat closed");
          stopAudio();
      }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || !chatSessionRef.current) return;

    const userText = inputText.trim();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    playClick();

    try {
        const result = await chatSessionRef.current.sendMessage({ message: userText });
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text || "I'm sorry, I couldn't understand that."
        };
        setMessages(prev => [...prev, aiMsg]);
        playSuccess();
        announce("New message from AI");
    } catch (err: any) {
        console.error("Chat Error", err);
        let errorText = "Sorry, I'm having trouble connecting right now.";
        
        if (err?.message?.includes("404") || err?.message?.includes("Not Found")) {
            errorText = "I need a valid project connection to answer complex questions. Please ensure your API key is correctly configured in settings.";
        } else {
            errorText = "I encountered a processing error. Please try a simpler question or check your connection.";
        }

        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: errorText
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  const speakMessage = async (msg: Message) => {
    if (speakingMessageId === msg.id) {
        stopAudio();
        return;
    }

    stopAudio();
    setSpeakingMessageId(msg.id);
    playClick();

    try {
        const base64Audio = await generateSpeech(msg.text);
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => {
            setSpeakingMessageId(null);
            audioSourceRef.current = null;
        };
        
        audioSourceRef.current = source;
        source.start();
    } catch (err) {
        console.error("Speech failed", err);
        setSpeakingMessageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-green/50 ${
            isOpen ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-90' : 'bg-brand-green text-white hover:bg-brand-green-dark'
        }`}
        aria-label={isOpen ? "Close Chat" : "Open Skincare Assistant"}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
      </button>

      <div 
        className={`fixed bottom-24 right-6 w-[90vw] sm:w-[420px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-100 dark:border-gray-700 ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}
        style={{ height: 'min(600px, 80vh)' }}
        role="dialog"
        aria-label="AI Expert Assistant Chat"
      >
        <div className="bg-brand-green p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center text-white">
                <div className="p-1.5 bg-white/20 rounded-lg mr-3">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Expert Assistant</h3>
                    <div className="flex items-center text-[10px] text-brand-green-light opacity-90 gap-1 font-semibold uppercase tracking-wider">
                        <BoltIcon className="w-2.5 h-2.5" />
                        Gemini 3 Pro Enabled
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button 
                    onClick={clearHistory}
                    className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Clear History"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
                <button 
                    onClick={toggleChat}
                    className="p-1.5 text-white/80 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                    <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap relative group shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-brand-green text-white rounded-br-none' 
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-600'
                        }`}
                    >
                        {msg.text}
                        {msg.role === 'model' && msg.id !== 'init' && (
                            <button 
                                onClick={() => speakMessage(msg)}
                                className={`absolute -right-8 bottom-0 p-1 rounded-full transition-opacity ${speakingMessageId === msg.id ? 'opacity-100 text-brand-green' : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-brand-green'}`}
                                title="Listen"
                            >
                                <AudioSparkIcon className={`w-4 h-4 ${speakingMessageId === msg.id ? 'animate-pulse' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600">
                        <div className="flex space-x-1.5 items-center">
                            <Spinner className="w-4 h-4 text-brand-green" />
                            <span className="text-xs text-gray-400 font-medium">Assistant is thinking...</span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
                <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about ingredients or nutrition..."
                    className="w-full pl-4 pr-3 py-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-brand-green resize-none text-sm custom-scrollbar max-h-32"
                    rows={1}
                    style={{ minHeight: '48px' }}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-3 bg-brand-green text-white rounded-xl hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-md mb-[2px]"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                </button>
            </form>
            <div className="flex items-center justify-center gap-1.5 mt-2 opacity-60">
                <BoltIcon className="w-2.5 h-2.5 text-brand-green" />
                <p className="text-[10px] text-center text-gray-400 font-medium">
                    Profile context active for personalized insights.
                </p>
            </div>
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Confirm Action
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to clear all chat history?
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={cancelClear}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmClear}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Clear History
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};


import React, { useState, useRef, useEffect } from 'react';
import { Chat } from "@google/genai";
import { UserProfile } from '../types';
import { createChatSession } from '../services/geminiService';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { Spinner } from './Spinner';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { SparklesIcon } from './icons/SparklesIcon';

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
    { id: 'init', role: 'model', text: "Hi! I'm your AI Skincare Assistant. Ask me anything about your skin, ingredients, or routine!" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { playClick, playSuccess, announce } = useAccessibility();

  // Initialize chat session
  useEffect(() => {
    try {
        if (!chatSessionRef.current) {
            chatSessionRef.current = createChatSession(userProfile);
        }
    } catch (e) {
        console.error("Failed to init chat", e);
    }
  }, [userProfile]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opening
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
      }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    playClick();

    try {
        const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.text || "I'm sorry, I couldn't understand that."
        };
        setMessages(prev => [...prev, aiMsg]);
        playSuccess();
        announce("New message from AI");
    } catch (err) {
        console.error("Chat Error", err);
        const errorMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "Sorry, I'm having trouble connecting right now. Please try again."
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
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
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-green/50 ${
            isOpen ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-90' : 'bg-brand-green text-white hover:bg-brand-green-dark'
        }`}
        aria-label={isOpen ? "Close Chat" : "Open Skincare Assistant"}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 w-[90vw] sm:w-[380px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-100 dark:border-gray-700 ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}
        style={{ height: 'min(500px, 70vh)' }}
        role="dialog"
        aria-label="AI Skincare Assistant Chat"
      >
        {/* Header */}
        <div className="bg-brand-green p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center text-white">
                <div className="p-1.5 bg-white/20 rounded-lg mr-3">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-sm">Skin Assistant</h3>
                    <p className="text-xs text-brand-green-light opacity-90">Powered by Gemini 3 Pro</p>
                </div>
            </div>
            <button 
                onClick={toggleChat}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Close"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div 
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-brand-green text-white rounded-br-none shadow-sm' 
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-600'
                        }`}
                    >
                        {msg.text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600">
                        <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
                <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about skincare..."
                    className="w-full pl-4 pr-3 py-3 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white border-none focus:ring-2 focus:ring-brand-green resize-none text-sm custom-scrollbar max-h-24"
                    rows={1}
                    style={{ minHeight: '44px' }}
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading}
                    className="p-3 bg-brand-green text-white rounded-xl hover:bg-brand-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green mb-[1px]"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="w-5 h-5 -rotate-45 translate-x-[-1px] translate-y-[1px]" />
                </button>
            </form>
            <p className="text-[10px] text-center text-gray-400 mt-2">
                AI can make mistakes. Please verify important info.
            </p>
        </div>
      </div>
    </>
  );
};

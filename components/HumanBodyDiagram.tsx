import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface HumanBodyDiagramProps {
  affectedParts?: string[];
}

export const HumanBodyDiagram: React.FC<HumanBodyDiagramProps> = ({ affectedParts = [] }) => {
  const [isVisible, setIsVisible] = useState(true);
  const parts = affectedParts.map(p => p.toLowerCase());

  // Reset visibility when affectedParts change
  useEffect(() => {
    if (parts.length > 0) {
      setIsVisible(true);
    }
  }, [affectedParts.join(',')]);

  const isAffected = (partNames: string[]) => {
    return partNames.some(name => parts.includes(name) || parts.some(p => p.includes(name) || name.includes(p)));
  };

  if (parts.length === 0 || !isVisible) return null;

  const showSkin = isAffected(['skin', 'full body', 'all']);
  
  // Define nodes for different body parts
  const nodes = [
    { id: 'head', names: ['head', 'brain', 'face', 'eyes', 'hair'], cx: 50, cy: 20, r: 12 },
    { id: 'neck', names: ['neck', 'throat'], cx: 50, cy: 40, r: 6 },
    { id: 'chest', names: ['chest', 'heart', 'lungs', 'torso'], cx: 50, cy: 65, r: 15 },
    { id: 'abdomen', names: ['stomach', 'abdomen', 'liver', 'kidneys', 'gut', 'intestines'], cx: 50, cy: 95, r: 15 },
    { id: 'left-arm', names: ['arm', 'arms', 'left arm'], cx: 20, cy: 80, r: 10 },
    { id: 'right-arm', names: ['arm', 'arms', 'right arm'], cx: 80, cy: 80, r: 10 },
    { id: 'left-hand', names: ['hand', 'hands', 'left hand'], cx: 14, cy: 115, r: 6 },
    { id: 'right-hand', names: ['hand', 'hands', 'right hand'], cx: 86, cy: 115, r: 6 },
    { id: 'left-leg', names: ['leg', 'legs', 'left leg'], cx: 38, cy: 160, r: 12 },
    { id: 'right-leg', names: ['leg', 'legs', 'right leg'], cx: 62, cy: 160, r: 12 },
    { id: 'left-foot', names: ['foot', 'feet', 'left foot'], cx: 40, cy: 205, r: 6 },
    { id: 'right-foot', names: ['foot', 'feet', 'right foot'], cx: 60, cy: 205, r: 6 },
  ];

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-white/80 dark:bg-[#0a0f16]/80 backdrop-blur-2xl p-5 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40 dark:border-cyan-900/30 flex flex-col items-center animate-slide-up max-w-[240px] transition-all duration-300">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
          <h4 className="text-[10px] font-bold text-gray-800 dark:text-cyan-100 uppercase tracking-[0.2em]">Biometric Scan</h4>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:text-cyan-600 dark:hover:text-cyan-300 focus:outline-none bg-gray-100/50 dark:bg-cyan-950/50 hover:bg-gray-200 dark:hover:bg-cyan-900/80 p-1.5 rounded-full transition-colors"
          aria-label="Close diagram"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative w-full flex justify-center">
        {/* Holographic scanning line effect */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-lg mask-image-b">
          <div className="w-full h-0.5 bg-cyan-400/50 dark:bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-scan-line"></div>
        </div>

        <svg viewBox="0 0 100 220" className="w-full h-auto max-h-[220px] drop-shadow-2xl relative z-10 overflow-visible">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <filter id="blurGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="currentColor" strokeWidth="0.2" strokeOpacity="0.3" />
            </pattern>
          </defs>

          {/* Continuous Body Silhouette */}
          <g className={showSkin ? "text-red-500 dark:text-red-500" : "text-gray-300 dark:text-cyan-900/60"}>
            <path 
              d="M50 5 C42 5 37 12 37 20 C37 26 40 32 44 36 C44 38 43 42 40 44 C30 48 22 52 18 58 C14 64 12 75 10 85 C8 95 8 110 10 120 C12 125 16 125 18 120 C20 110 22 95 24 85 C26 75 28 65 30 60 C30 70 30 85 32 100 C34 115 38 125 40 130 C40 150 38 175 35 195 C33 205 35 210 38 210 C42 210 45 205 46 195 C48 175 50 150 50 135 C50 150 52 175 54 195 C55 205 58 210 62 210 C65 210 67 205 65 195 C62 175 60 150 60 130 C62 125 66 115 68 100 C70 85 70 70 70 60 C72 65 74 75 76 85 C78 95 80 110 82 120 C84 125 88 125 90 120 C92 110 92 95 90 85 C88 75 86 64 82 58 C78 52 70 48 60 44 C57 42 56 38 56 36 C60 32 63 26 63 20 C63 12 58 5 50 5 Z" 
              fill="url(#bodyGradient)" 
              stroke={showSkin ? "#ef4444" : "currentColor"} 
              strokeWidth={showSkin ? "1.5" : "0.5"}
              style={showSkin ? { filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' } : {}}
              className="transition-all duration-700"
            />
            {/* Tech Grid Overlay */}
            <path 
              d="M50 5 C42 5 37 12 37 20 C37 26 40 32 44 36 C44 38 43 42 40 44 C30 48 22 52 18 58 C14 64 12 75 10 85 C8 95 8 110 10 120 C12 125 16 125 18 120 C20 110 22 95 24 85 C26 75 28 65 30 60 C30 70 30 85 32 100 C34 115 38 125 40 130 C40 150 38 175 35 195 C33 205 35 210 38 210 C42 210 45 205 46 195 C48 175 50 150 50 135 C50 150 52 175 54 195 C55 205 58 210 62 210 C65 210 67 205 65 195 C62 175 60 150 60 130 C62 125 66 115 68 100 C70 85 70 70 70 60 C72 65 74 75 76 85 C78 95 80 110 82 120 C84 125 88 125 90 120 C92 110 92 95 90 85 C88 75 86 64 82 58 C78 52 70 48 60 44 C57 42 56 38 56 36 C60 32 63 26 63 20 C63 12 58 5 50 5 Z" 
              fill="url(#grid)" 
              className="mix-blend-overlay opacity-50"
            />
          </g>

          {/* Glowing Nodes for Affected Parts */}
          {nodes.map(node => {
            const affected = isAffected(node.names);
            if (!affected) return null;
            return (
              <g key={node.id} className="animate-subtle-pulse">
                <circle cx={node.cx} cy={node.cy} r={node.r * 1.5} fill="url(#nodeGlow)" />
                <circle cx={node.cx} cy={node.cy} r={node.r * 0.4} fill="#ffffff" filter="url(#blurGlow)" />
                <circle cx={node.cx} cy={node.cy} r={node.r * 0.2} fill="#ffffff" />
                {/* Tech targeting crosshairs */}
                <path d={`M${node.cx - node.r} ${node.cy} L${node.cx + node.r} ${node.cy} M${node.cx} ${node.cy - node.r} L${node.cx} ${node.cy + node.r}`} stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.8" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="w-full mt-4">
        <div className="flex flex-wrap justify-center gap-1.5">
          {affectedParts.map((part, idx) => (
            <span key={idx} className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">
              {part}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); transform-origin: center; }
          50% { opacity: 0.8; transform: scale(1.05); transform-origin: center; }
        }
        .animate-subtle-pulse {
          animation: subtle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes scan-line {
          0% { transform: translateY(-10px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(230px); opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
        .mask-image-b {
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
};

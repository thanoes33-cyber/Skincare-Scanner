
export interface UserProfile {
  skinType: string;
  skinConcerns: string[];
  healthConditions: string;
  ingredientSensitivities: Record<string, 'high' | 'moderate'>;
}

// User interface added to resolve import error in AccountSettingsModal
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  dateOfBirth?: string;
  bio?: string;
}

export interface AnalysisIngredient {
  name: string;
  description: string;
  isProcessed: boolean;
  isOrganic: boolean;
}

export interface AnalysisNutrient {
  name: string;
  amount: string;
  description: string;
}

export interface SkinAnalysis {
  summary: string;
  positiveEffects: string[];
  negativeEffects: string[];
}

export interface RecallInfo {
    hasRecall: boolean;
    details: string;
    date?: string;
}

export interface AnalysisResult {
  productName: string;
  ingredients: AnalysisIngredient[];
  nutrients: AnalysisNutrient[];
  skinAnalysis: SkinAnalysis;
  affectedBodyParts?: string[];
  recallInfo?: RecallInfo;
  organicStatus: string;
  processingLevel: string;
}

export interface GlossaryEntry {
  name: string;
  commonUses: string;
  potentialBenefits: string;
  possibleReactions: string;
}

export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  productName: string;
  thumbnail: string;
  result: AnalysisResult;
  favorite?: boolean;
}

export type ActivityType = 'scan' | 'routine' | 'note';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  details?: string;
  timestamp: number; // Start time
  durationMinutes?: number; // 0 for instant events like scans
  notes?: string;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

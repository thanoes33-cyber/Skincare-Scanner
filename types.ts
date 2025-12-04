
export interface User {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  subscriptionStatus: 'Active' | 'Inactive';
  bio?: string;
  photo?: string; // Base64 string
}

export interface UserProfile {
  skinType: string;
  skinConcerns: string[];
  healthConditions: string;
  ingredientSensitivities: Record<string, 'high' | 'moderate'>;
}

export interface AnalysisIngredient {
  name: string;
  description: string;
}

export interface AnalysisNutrient {
  name:string;
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
  recallInfo?: RecallInfo;
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
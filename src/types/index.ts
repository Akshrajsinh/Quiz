export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ImageQuestion {
  id: string;
  image: string;
  question: string;
  correctAnswer: string;
  points?: number;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation?: string;
  image?: string;
  category?: string;
  difficulty?: Difficulty;
  points?: number;
}

export type RoundKey = 'dashboard' | 'poster' | 'round1' | 'round2' | 'scoreboard';

export interface EventMeta {
  eventName: string;
  subtitle: string;
  currentRound: RoundKey;
  eventStarted: boolean;
}

export interface QuestionBank {
  round1: ImageQuestion[];
  round2: MCQQuestion[];
}

export type Round2Mode = 'standard' | 'buzzer';

export type BuzzerStatus = 'idle' | 'open' | 'locked' | 'answering' | 'evaluated';

export interface Candidate {
  id: string;
  name: string;
  seatNumber?: string;
  score: number;
  totalBuzzerWins: number;
  joinedAt?: number;
}

export interface FastestFingerRecord {
  rank: number;
  candidateId: string;
  candidateName: string;
  seatNumber?: string;
  timestamp: number;
  responseTimeMs: number;
}


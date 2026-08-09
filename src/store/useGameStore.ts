import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import defaultBank from '../data/questionBank.json';
import { indexedDbStorage } from './indexedDbStorage';
import type { RoundKey, QuestionBank, Round2Mode, BuzzerStatus, Candidate, FastestFingerRecord } from '../types';
import { buzzerSync, type SyncMessage } from '../utils/buzzerSync';
import { sfx } from '../utils/sound';

interface GameState {
  eventName: string;
  subtitle: string;
  currentRound: RoundKey;
  eventStarted: boolean;

  totalScore: number;
  roundScores: {
    round1: number;
    round2: number;
  };

  bank: QuestionBank;

  // Round 1 progress — Picture Question challenge
  r1Index: number;
  r1Revealed: boolean;

  // Round 2 progress — MCQ challenge
  r2Index: number;
  r2TimerDuration: 30 | 45 | 60;
  round2Mode: Round2Mode;

  // Round 2 Audition Buzzer System State
  buzzerStatus: BuzzerStatus;
  buzzerOpenTime: number | null;
  candidates: Candidate[];
  buzzerPressFeed: FastestFingerRecord[];
  currentAnsweringRankIndex: number;

  // timer shared state
  timerRunning: boolean;
  timerSecondsLeft: number;

  darkMode: boolean;

  // actions
  setEventMeta: (name: string, subtitle: string) => void;
  startEvent: () => void;
  goToRound: (round: RoundKey) => void;
  awardScore: (round: 'round1' | 'round2', points: number) => void;
  setBank: (bank: QuestionBank) => void;

  nextR1: () => void;
  prevR1: () => void;
  revealR1: () => void;
  goToR1: (index: number) => void;

  nextR2: () => void;
  prevR2: () => void;
  setR2TimerDuration: (d: 30 | 45 | 60) => void;
  setRound2Mode: (mode: Round2Mode) => void;

  // Buzzer Actions
  openBuzzer: () => void;
  pressBuzzer: (candidateId: string, candidateName: string, seatNumber?: string) => void;
  resetBuzzer: () => void;
  passToNextFastest: () => void;

  // Candidate Management Actions
  addCandidate: (name: string, seatNumber?: string) => Candidate;
  importCandidates: (candidates: Partial<Candidate>[]) => void;
  removeCandidate: (id: string) => void;
  clearCandidates: () => void;
  awardCandidateScore: (candidateId: string, points: number) => void;

  startTimer: (seconds: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  resetTimer: (seconds?: number) => void;

  toggleDarkMode: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      eventName: 'Gyan Challenge',
      subtitle: 'A Spiritual Quiz Celebration',
      currentRound: 'dashboard',
      eventStarted: false,

      totalScore: 0,
      roundScores: { round1: 0, round2: 0 },
      bank: defaultBank as unknown as QuestionBank,

      r1Index: 0,
      r1Revealed: false,

      r2Index: 0,
      r2TimerDuration: 30,
      round2Mode: 'buzzer',

      buzzerStatus: 'idle',
      buzzerOpenTime: null,
      candidates: [
        { id: 'cand-1', name: 'Rameshbhai Patel', seatNumber: 'A-101', score: 0, totalBuzzerWins: 0 },
        { id: 'cand-2', name: 'Jignesh Shah', seatNumber: 'A-102', score: 0, totalBuzzerWins: 0 },
        { id: 'cand-3', name: 'Suresh Varma', seatNumber: 'B-205', score: 0, totalBuzzerWins: 0 },
        { id: 'cand-4', name: 'Priya Dave', seatNumber: 'C-301', score: 0, totalBuzzerWins: 0 },
      ],
      buzzerPressFeed: [],
      currentAnsweringRankIndex: 0,

      timerRunning: false,
      timerSecondsLeft: 30,

      darkMode: true,

      setEventMeta: (eventName, subtitle) => set({ eventName, subtitle }),
      startEvent: () => set({ eventStarted: true, currentRound: 'round1' }),
      goToRound: (round) => set({ currentRound: round }),
      setBank: (bank) => set({ bank }),

      awardScore: (round, points) =>
        set((state) => ({
          totalScore: state.totalScore + points,
          roundScores: { ...state.roundScores, [round]: state.roundScores[round] + points },
        })),

      nextR1: () =>
        set((state) => ({
          r1Index: Math.min(state.r1Index + 1, Math.max(state.bank.round1.length - 1, 0)),
          r1Revealed: false,
        })),
      prevR1: () =>
        set((state) => ({
          r1Index: Math.max(state.r1Index - 1, 0),
          r1Revealed: false,
        })),
      revealR1: () => set({ r1Revealed: true }),
      goToR1: (index) =>
        set((state) => ({
          r1Index: Math.max(0, Math.min(index, Math.max(state.bank.round1.length - 1, 0))),
          r1Revealed: false,
        })),

      nextR2: () => {
        set((state) => ({
          r2Index: Math.min(state.r2Index + 1, state.bank.round2.length - 1),
          buzzerStatus: 'idle',
          buzzerPressFeed: [],
          currentAnsweringRankIndex: 0,
          buzzerOpenTime: null,
        }));
        buzzerSync.send({ type: 'RESET_BUZZER', payload: {} });
      },
      prevR2: () => {
        set((state) => ({
          r2Index: Math.max(state.r2Index - 1, 0),
          buzzerStatus: 'idle',
          buzzerPressFeed: [],
          currentAnsweringRankIndex: 0,
          buzzerOpenTime: null,
        }));
        buzzerSync.send({ type: 'RESET_BUZZER', payload: {} });
      },
      setR2TimerDuration: (d) => set({ r2TimerDuration: d, timerSecondsLeft: d }),
      setRound2Mode: (mode) => set({ round2Mode: mode }),

      openBuzzer: () => {
        const now = Date.now();
        set({
          buzzerStatus: 'open',
          buzzerOpenTime: now,
          buzzerPressFeed: [],
          currentAnsweringRankIndex: 0,
        });
        sfx.buzzerOpen();
        buzzerSync.send({
          type: 'BUZZER_STATE_UPDATE',
          payload: { status: 'open', openTime: now },
        });
      },

      pressBuzzer: (candidateId, candidateName, seatNumber) => {
        const state = get();
        if (state.buzzerStatus !== 'open' && state.buzzerStatus !== 'locked') return;

        // Check if candidate already buzzed
        if (state.buzzerPressFeed.some((p) => p.candidateId === candidateId)) return;

        // Up to 10 candidates can press per buzzer round
        if (state.buzzerPressFeed.length >= 10) return;

        const openTime = state.buzzerOpenTime ?? Date.now();
        const now = Date.now();
        const responseTimeMs = Math.max(10, Math.round(now - openTime));

        const rank = state.buzzerPressFeed.length + 1;
        const newRecord: FastestFingerRecord = {
          rank,
          candidateId,
          candidateName,
          seatNumber,
          timestamp: now,
          responseTimeMs,
        };

        const updatedFeed = [...state.buzzerPressFeed, newRecord];
        const isMaxReached = updatedFeed.length >= 10;
        const nextStatus: BuzzerStatus = isMaxReached ? 'locked' : 'open';

        if (rank === 1) {
          sfx.buzzerPress();
          set((s) => ({
            candidates: s.candidates.map((c) =>
              c.id === candidateId ? { ...c, totalBuzzerWins: c.totalBuzzerWins + 1 } : c
            ),
          }));
        }

        set({
          buzzerStatus: nextStatus,
          buzzerPressFeed: updatedFeed,
          currentAnsweringRankIndex: 0,
        });

        buzzerSync.send({
          type: 'PRESS_BUZZER',
          payload: newRecord,
        });

        if (isMaxReached) {
          buzzerSync.send({
            type: 'BUZZER_STATE_UPDATE',
            payload: { status: 'locked', openTime: state.buzzerOpenTime },
          });
        }
      },

      resetBuzzer: () => {
        set({
          buzzerStatus: 'idle',
          buzzerPressFeed: [],
          currentAnsweringRankIndex: 0,
          buzzerOpenTime: null,
        });
        buzzerSync.send({ type: 'RESET_BUZZER', payload: {} });
      },

      passToNextFastest: () => {
        const state = get();
        if (state.currentAnsweringRankIndex + 1 < state.buzzerPressFeed.length) {
          sfx.navigate();
          set({ currentAnsweringRankIndex: state.currentAnsweringRankIndex + 1 });
        }
      },

      addCandidate: (name, seatNumber) => {
        const newCandidate: Candidate = {
          id: `cand-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: name.trim(),
          seatNumber: seatNumber?.trim(),
          score: 0,
          totalBuzzerWins: 0,
          joinedAt: Date.now(),
        };
        set((state) => ({
          candidates: [...state.candidates, newCandidate],
        }));
        return newCandidate;
      },

      importCandidates: (cList) => {
        const newCandidates: Candidate[] = cList.map((c, i) => ({
          id: c.id || `cand-imp-${Date.now()}-${i}`,
          name: (c.name || `Candidate ${i + 1}`).trim(),
          seatNumber: c.seatNumber || `Seat #${i + 1}`,
          score: c.score || 0,
          totalBuzzerWins: c.totalBuzzerWins || 0,
          joinedAt: Date.now(),
        }));
        set((state) => ({
          candidates: [...state.candidates, ...newCandidates],
        }));
      },

      removeCandidate: (id) =>
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
        })),

      clearCandidates: () => set({ candidates: [] }),

      awardCandidateScore: (candidateId, points) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, score: c.score + points } : c
          ),
          totalScore: state.totalScore + points,
          roundScores: { ...state.roundScores, round2: state.roundScores.round2 + points },
        }));
      },

      startTimer: (seconds) => set({ timerRunning: true, timerSecondsLeft: seconds }),
      pauseTimer: () => set({ timerRunning: false }),
      resumeTimer: () => set({ timerRunning: true }),
      tickTimer: () =>
        set((state) => ({
          timerSecondsLeft: Math.max(0, state.timerSecondsLeft - 1),
          timerRunning: state.timerSecondsLeft > 0,
        })),
      resetTimer: (seconds) =>
        set((state) => ({ timerSecondsLeft: seconds ?? state.r2TimerDuration, timerRunning: false })),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      resetGame: () =>
        set({
          totalScore: 0,
          roundScores: { round1: 0, round2: 0 },
          currentRound: 'dashboard',
          eventStarted: false,
          r1Index: 0,
          r1Revealed: false,
          r2Index: 0,
          timerRunning: false,
          buzzerStatus: 'idle',
          buzzerPressFeed: [],
          currentAnsweringRankIndex: 0,
        }),
    }),
    {
      name: 'gyan-challenge-storage',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: (state) => {
        const { timerRunning, timerSecondsLeft, r1Revealed, buzzerStatus, buzzerPressFeed, ...rest } = state;
        return rest;
      },
    }
  )
);

// Host listener for real-time mobile candidate events
if (typeof window !== 'undefined') {
  buzzerSync.subscribe((msg: SyncMessage) => {
    // Only execute if running as Host (not mobile buzzer mode)
    const isMobileView = window.location.search.includes('mode=buzzer');
    if (isMobileView) return;

    const store = useGameStore.getState();

    if (msg.type === 'PRESS_BUZZER') {
      const payload = msg.payload;
      // If raw candidate press from mobile (no rank assigned yet)
      if (payload && payload.candidateId && typeof payload.rank !== 'number') {
        store.pressBuzzer(payload.candidateId, payload.candidateName, payload.seatNumber);
      }
    } else if (msg.type === 'JOIN_CANDIDATE') {
      const payload = msg.payload;
      if (payload && payload.candidateName) {
        const exists = store.candidates.some(
          (c) => c.id === payload.candidateId || c.name.toLowerCase() === payload.candidateName.toLowerCase()
        );
        if (!exists) {
          store.addCandidate(payload.candidateName, payload.seatNumber);
        }
        // Respond with current buzzer status so joining client syncs immediately
        buzzerSync.send({
          type: 'BUZZER_STATE_UPDATE',
          payload: { status: store.buzzerStatus, openTime: store.buzzerOpenTime },
        });
      }
    }
  });
}
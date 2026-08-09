import { motion } from 'framer-motion';
import { Play, RotateCcw, Settings2, Award, Tv } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import MandalaRing from '../components/MandalaRing';
import OmSymbol from '../components/OmSymbol';
import RoundRulesModal from '../components/RoundRulesModal';
import { sfx } from '../utils/sound';
import { useState } from 'react';
import QuestionManager from './QuestionManager';
import type { RoundKey } from '../types';

type PlayableRound = 'round1' | 'round2';

export default function Dashboard() {
  const { eventName, subtitle, eventStarted, currentRound, totalScore, roundScores, startEvent, goToRound, resetGame } =
    useGameStore();
  const [showManager, setShowManager] = useState(false);
  const [pending, setPending] = useState<{ round: PlayableRound; kind: 'start' | 'nav' } | null>(null);

  const requestRound = (round: PlayableRound, kind: 'start' | 'nav') => {
    sfx.click();
    setPending({ round, kind });
  };

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'start') {
      sfx.fanfare();
      startEvent();
    } else {
      sfx.navigate();
      goToRound(pending.round);
    }
    setPending(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40">
        <MandalaRing size={640} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center mb-10"
      >
        <div className="mb-4 flex items-center justify-center gap-3 text-marigold/80 font-score text-xs tracking-[0.3em] uppercase">
          <span className="brass-divider w-10" />
          <OmSymbol size={20} className="text-brass" />
          Presenter Edition
          <OmSymbol size={20} className="text-brass" />
          <span className="brass-divider w-10" />
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-bold text-gradient-saffron drop-shadow-[0_2px_20px_rgba(255,107,26,0.35)]">
          {eventName}
        </h1>
        <p className="mt-3 font-body text-cream/60 text-lg">{subtitle}</p>
      </motion.div>

      <div className="relative z-10 grid w-full max-w-2xl grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <GlassCard delay={0.1} className="p-5 text-center">
          <p className="font-score font-semibold text-cream/70 text-sm uppercase tracking-wider">Round 1</p>
          <p className="mt-1 font-score text-3xl font-bold text-gradient-saffron">{roundScores.round1}</p>
          <p className="text-xs text-cream/40 mt-0.5">picture points</p>
        </GlassCard>
        <GlassCard delay={0.18} className="p-5 text-center">
          <p className="font-score font-semibold text-cream/70 text-sm uppercase tracking-wider">Round 2</p>
          <p className="mt-1 font-score text-3xl font-bold text-gradient-saffron">{roundScores.round2}</p>
          <p className="text-xs text-cream/40 mt-0.5">mcq points</p>
        </GlassCard>
        <GlassCard delay={0.26} className="p-5 text-center border-marigold/40 shadow-glow">
          <p className="font-score font-semibold text-marigold text-sm uppercase tracking-wider">Total Score</p>
          <p className="mt-1 font-score text-3xl font-bold text-gradient-saffron">{totalScore}</p>
          <p className="text-xs text-cream/40 mt-0.5">total points</p>
        </GlassCard>
      </div>

      <GlassCard arch className="relative z-10 w-full max-w-lg p-8 flex flex-col items-center gap-4" delay={0.3}>
        {!eventStarted ? (
          <button
            onClick={() => requestRound('round1', 'start')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            <Play size={20} fill="currentColor" /> Start Quiz
          </button>
        ) : (
          <button
            onClick={() => {
              const target = currentRound === 'dashboard' ? 'round1' : currentRound;
              if (target === 'round1' || target === 'round2') {
                requestRound(target, 'nav');
              } else {
                sfx.click();
                goToRound(target as RoundKey);
              }
            }}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            <Play size={20} fill="currentColor" /> Continue Quiz
          </button>
        )}

        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('poster');
            }}
            className="btn-secondary flex items-center justify-center gap-2 text-marigold border-marigold/40 hover:bg-marigold/10"
          >
            <Tv size={18} /> Stage Poster
          </button>
          <button
            onClick={() => setShowManager(true)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Settings2 size={18} /> Manage & Export Data
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-cream/40">
          <button
            onClick={() => setShowManager(true)}
            className="flex items-center gap-1.5 hover:text-marigold transition-colors text-marigold/80 font-score"
          >
            📥 1-Click Export / Import Questions
          </button>
          <span>·</span>
          <button
            onClick={() => {
              if (confirm('Reset the entire event? All scores and progress will be cleared.')) {
                resetGame();
              }
            }}
            className="flex items-center gap-1.5 hover:text-kumkum transition-colors"
          >
            <RotateCcw size={14} /> Reset Event
          </button>
        </div>
      </GlassCard>

      <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
        {(['round1', 'round2'] as const).map((r, i) => (
          <button
            key={r}
            onClick={() => requestRound(r, 'nav')}
            className="px-6 py-2.5 rounded-full glass text-sm font-score text-cream/80 hover:text-marigold hover:scale-105 transition-all flex items-center gap-2"
          >
            <Award size={16} className="text-marigold" />
            Round {i + 1} {i === 0 ? '· Picture Question' : '· MCQ Challenge'}
          </button>
        ))}
      </div>

      {showManager && <QuestionManager onClose={() => setShowManager(false)} />}
      {pending && (
        <RoundRulesModal round={pending.round} onStart={confirmPending} onClose={() => setPending(null)} />
      )}
    </div>
  );
}


import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Award, CheckCircle } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from '../components/GlassCard';
import { fireWinnerCelebration } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';

export default function Scoreboard() {
  const { totalScore, roundScores, eventName } = useGameStore();
  const [showCelebration, setShowCelebration] = useState(false);

  const celebrate = () => {
    setShowCelebration(true);
    sfx.fanfare();
    fireWinnerCelebration();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Quiz Summary & Scoreboard
        <span className="brass-divider w-8" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl space-y-6"
      >
        <GlassCard arch glow="saffron" className="p-8 text-center flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-saffron-500/20 text-marigold flex items-center justify-center mb-1">
            <Trophy size={36} />
          </div>
          <p className="text-xs font-score uppercase tracking-[0.25em] text-cream/50">{eventName}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-saffron">
            Quiz Completed!
          </h1>
          <div className="mt-2 p-6 glass rounded-2xl w-full max-w-sm border-marigold/30 shadow-glow">
            <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-1">Total Score</p>
            <p className="font-score text-5xl font-bold text-gradient-saffron">{totalScore}</p>
            <p className="text-xs text-cream/50 mt-1">points earned</p>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GlassCard className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-saffron-500/10 text-marigold flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <p className="font-score font-semibold text-cream/90 text-sm">Round 1</p>
                <p className="text-xs text-cream/40">Picture Question</p>
              </div>
            </div>
            <span className="font-score text-2xl font-bold text-gradient-saffron">{roundScores.round1} pts</span>
          </GlassCard>

          <GlassCard className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-saffron-500/10 text-marigold flex items-center justify-center">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="font-score font-semibold text-cream/90 text-sm">Round 2</p>
                <p className="text-xs text-cream/40">MCQ Challenge</p>
              </div>
            </div>
            <span className="font-score text-2xl font-bold text-gradient-saffron">{roundScores.round2} pts</span>
          </GlassCard>
        </div>
      </motion.div>

      <button onClick={celebrate} className="btn-primary flex items-center gap-2 text-lg px-8 py-3.5">
        <Trophy size={20} /> Celebrate Results
      </button>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              className="text-center p-8"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="text-8xl mb-6"
              >
                🏆
              </motion.div>
              <p className="font-score uppercase tracking-[0.3em] text-marigold text-sm mb-3">
                Final Score Achieved
              </p>
              <h1 className="font-display text-6xl sm:text-8xl font-bold text-gradient-saffron drop-shadow-[0_4px_30px_rgba(255,167,51,0.5)]">
                {totalScore} Points
              </h1>
              <p className="mt-4 font-body text-cream/70 text-lg">
                Round 1: {roundScores.round1} pts · Round 2: {roundScores.round2} pts
              </p>
              <p className="mt-8 text-cream/40 text-sm">Tap anywhere to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


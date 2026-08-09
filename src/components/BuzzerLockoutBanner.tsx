import { motion } from 'framer-motion';
import { Trophy, Zap, Clock, UserCheck } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import GlassCard from './GlassCard';

export default function BuzzerLockoutBanner() {
  const { buzzerStatus, buzzerPressFeed, currentAnsweringRankIndex } = useGameStore();

  if (buzzerStatus === 'idle') return null;

  if (buzzerStatus === 'open' && buzzerPressFeed.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <div className="glass rounded-3xl p-6 border-2 border-emerald/50 bg-emerald/10 shadow-glow-green text-center flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 text-emerald font-score text-sm uppercase tracking-widest font-bold">
            <span className="h-3 w-3 rounded-full bg-emerald animate-ping" />
            Buzzers Active · Multi-Candidate Fastest Finger
            <span className="h-3 w-3 rounded-full bg-emerald animate-ping" />
          </div>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-cream">
            ⚡ PRESS YOUR BUZZER NOW!
          </h3>
          <p className="text-sm font-body text-cream/70">
            Every candidate can press! The system will collect up to 10 buzzer responses and rank reaction times.
          </p>
        </div>
      </motion.div>
    );
  }

  const activeRecord = buzzerPressFeed[currentAnsweringRankIndex];
  if (!activeRecord) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl"
    >
      <GlassCard arch className="p-8 border-2 border-marigold/60 shadow-glow relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-saffron-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-marigold/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-saffron-500 to-marigold flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <UserCheck size={40} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 text-xs font-score text-marigold uppercase tracking-widest font-bold mb-1">
                <Zap size={16} fill="currentColor" />
                {buzzerStatus === 'open' ? (
                  <span className="text-emerald font-bold animate-pulse">
                    🟢 BUZZERS OPEN ({buzzerPressFeed.length}/10 Buzzes)
                  </span>
                ) : (
                  <span>🔒 BUZZERS LOCKED (10/10 Buzzes)</span>
                )}
                <span className="text-cream/50 font-normal">· Active Turn: Rank #{activeRecord.rank}</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-bold text-cream drop-shadow-md">
                {activeRecord.candidateName}
              </h2>
              {activeRecord.seatNumber && (
                <p className="text-sm font-score text-cream/70 mt-1">
                  Candidate ID / Seat: <span className="text-marigold font-bold">{activeRecord.seatNumber}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <div className="glass px-5 py-3 rounded-2xl border border-marigold/40 flex items-center gap-3">
              <Clock className="text-marigold" size={24} />
              <div>
                <p className="text-[10px] font-score uppercase tracking-widest text-cream/50">Reaction Time</p>
                <p className="font-score text-2xl font-bold text-marigold">
                  {(activeRecord.responseTimeMs / 1000).toFixed(3)}s
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Fastest Finger Summary (Up to 10) */}
        {buzzerPressFeed.length > 1 && (
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-score text-cream/50 uppercase tracking-widest">
              <span className="flex items-center gap-1.5">
                <Trophy size={14} className="text-marigold" /> Recorded Buzzer Ranks ({buzzerPressFeed.length}/10)
              </span>
              {buzzerStatus === 'open' && (
                <span className="text-emerald animate-pulse font-bold text-[11px]">
                  🟢 Buzzers open for other candidates...
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {buzzerPressFeed.map((rec) => (
                <div
                  key={`${rec.candidateId}-${rec.rank}`}
                  className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                    rec.rank === activeRecord.rank
                      ? 'bg-marigold/20 border border-marigold text-cream font-bold'
                      : 'bg-white/5 text-cream/60'
                  }`}
                >
                  <span className="truncate">
                    #{rec.rank} {rec.candidateName}
                  </span>
                  <span className="font-score opacity-80 text-[10px] shrink-0">{(rec.responseTimeMs / 1000).toFixed(3)}s</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

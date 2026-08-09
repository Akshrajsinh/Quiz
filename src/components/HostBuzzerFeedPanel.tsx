import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, SkipForward, Users, Search, CheckCircle2, Clock } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

export default function HostBuzzerFeedPanel() {
  const {
    candidates,
    buzzerPressFeed,
    currentAnsweringRankIndex,
    buzzerStatus,
    passToNextFastest,
    pressBuzzer,
  } = useGameStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);

  const activeCandidateRecord = buzzerPressFeed[currentAnsweringRankIndex];

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.seatNumber && c.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full max-w-sm glass rounded-3xl p-5 border border-marigold/30 flex flex-col gap-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="text-marigold animate-pulse" size={20} />
          <h3 className="font-display text-lg text-cream font-bold">Host Live Buzzer Feed</h3>
        </div>
        <span className="text-xs font-score bg-white/10 px-2.5 py-1 rounded-full text-marigold">
          {buzzerPressFeed.length} Buzzes
        </span>
      </div>

      {/* Active Answering Participant Banner */}
      {activeCandidateRecord ? (
        <div className="bg-gradient-to-r from-saffron-500/20 to-marigold/20 border border-saffron-500/50 rounded-2xl p-4 flex flex-col gap-2 shadow-glow">
          <div className="flex items-center justify-between text-xs font-score text-marigold uppercase tracking-wider">
            <span>⚡ Rank #{activeCandidateRecord.rank} Active Turn</span>
            <span className="flex items-center gap-1 text-cream/70">
              <Clock size={12} /> {(activeCandidateRecord.responseTimeMs / 1000).toFixed(3)}s
            </span>
          </div>
          <div className="text-xl font-display font-bold text-cream">
            {activeCandidateRecord.candidateName}
          </div>
          {activeCandidateRecord.seatNumber && (
            <span className="text-xs text-cream/60 font-score">{activeCandidateRecord.seatNumber}</span>
          )}

          {/* Pass to Next Fastest Button */}
          {currentAnsweringRankIndex + 1 < buzzerPressFeed.length && (
            <button
              onClick={passToNextFastest}
              className="mt-2 btn-secondary py-2 px-3 text-xs flex items-center justify-center gap-2 rounded-xl text-marigold border-marigold/40 hover:bg-marigold/20"
            >
              <SkipForward size={14} /> Pass to Next Fastest Finger (
              {buzzerPressFeed[currentAnsweringRankIndex + 1]?.candidateName})
            </button>
          )}
        </div>
      ) : buzzerStatus === 'open' ? (
        <div className="p-4 rounded-2xl bg-emerald/10 border border-emerald/30 text-center text-emerald font-score text-sm animate-pulse">
          🟢 BUZZERS ACTIVE — Waiting for 250+ Candidates to Press!
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center text-cream/50 font-score text-xs">
          Press "OPEN BUZZER" on the control bar to start receiving buzzes.
        </div>
      )}

      {/* Live Feed List of Every Buzzer Press */}
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
        <span className="text-xs font-score text-cream/40 uppercase tracking-widest">
          Live Press Log ({buzzerPressFeed.length})
        </span>
        <AnimatePresence>
          {buzzerPressFeed.length === 0 ? (
            <p className="text-xs text-cream/30 italic text-center py-4">No buzzer presses recorded yet.</p>
          ) : (
            buzzerPressFeed.map((rec, i) => {
              const isActive = i === currentAnsweringRankIndex;
              return (
                <motion.div
                  key={`${rec.candidateId}-${rec.timestamp}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-xl flex items-center justify-between text-xs transition-all ${
                    isActive
                      ? 'bg-saffron-500 text-white font-bold shadow-md'
                      : 'bg-white/5 text-cream/80 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className={`font-score font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                        rec.rank === 1
                          ? 'bg-marigold text-slate-900'
                          : rec.rank === 2
                          ? 'bg-slate-300 text-slate-900'
                          : rec.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-white/10 text-cream'
                      }`}
                    >
                      #{rec.rank}
                    </span>
                    <div className="truncate">
                      <span className="font-body text-sm font-semibold truncate block">{rec.candidateName}</span>
                      {rec.seatNumber && <span className="opacity-60 text-[10px] block">{rec.seatNumber}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-score">
                    <span className="opacity-70">{(rec.responseTimeMs / 1000).toFixed(3)}s</span>
                    {isActive && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Stage Manual Trigger (Host manually selects from 250+ candidate roster) */}
      <div className="border-t border-white/10 pt-3">
        <button
          onClick={() => setShowManualAdd(!showManualAdd)}
          className="text-xs font-score text-marigold flex items-center justify-between w-full hover:underline"
        >
          <span className="flex items-center gap-1.5">
            <Users size={14} /> Stage Buzzer Manual Select
          </span>
          <span>{showManualAdd ? 'Hide ▲' : 'Show Roster ▼'}</span>
        </button>

        {showManualAdd && (
          <div className="mt-3 flex flex-col gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-cream/40" />
              <input
                type="text"
                placeholder="Search candidate name or seat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-cream focus:outline-none focus:border-marigold"
              />
            </div>
            <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
              {filteredCandidates.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  onClick={() => pressBuzzer(c.id, c.name, c.seatNumber)}
                  disabled={buzzerStatus !== 'open' && buzzerStatus !== 'locked'}
                  className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-marigold/20 text-cream text-xs flex justify-between items-center transition-colors disabled:opacity-40"
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-[10px] opacity-50">{c.seatNumber}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  Users,
  QrCode,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import DiyaTimer from '../components/DiyaTimer';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';
import BuzzerLockoutBanner from '../components/BuzzerLockoutBanner';
import HostBuzzerFeedPanel from '../components/HostBuzzerFeedPanel';
import CandidateManagerModal from '../components/CandidateManagerModal';
import BuzzerQRCodeModal from '../components/BuzzerQRCodeModal';

const letters = ['A', 'B', 'C', 'D'];
const CORRECT_POINTS = 10;
const WRONG_POINTS = 0;

export default function Round2MCQ() {
  const {
    bank,
    r2Index,
    r2TimerDuration,
    round2Mode,
    buzzerStatus,
    buzzerPressFeed,
    currentAnsweringRankIndex,
    nextR2,
    prevR2,
    setR2TimerDuration,
    setRound2Mode,
    openBuzzer,
    lockBuzzer,
    resetBuzzer,
    stageMode,
    awardScore,
    awardCandidateScore,
    goToRound,
  } = useGameStore();

  const question = bank.round2[r2Index];

  const handleTimerExpire = () => {
    const state = useGameStore.getState();
    if (state.round2Mode === 'buzzer' && state.buzzerStatus === 'open') {
      state.lockBuzzer();
    }
  };

  const { secondsLeft, running, start, pause, reset } = useCountdown(r2TimerDuration, handleTimerExpire);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showCandidateManager, setShowCandidateManager] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const activeRecord = buzzerPressFeed[currentAnsweringRankIndex];
  const answered = selectedIndex !== null;

  useEffect(() => {
    reset(r2TimerDuration);
    setSelectedIndex(null);
    resetBuzzer();
  }, [r2Index, r2TimerDuration]);

  // Keyboard shortcut listener for space (open buzzer / lock)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && round2Mode === 'buzzer') {
        e.preventDefault();
        if (buzzerStatus === 'idle') {
          openBuzzer();
          start();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (round2Mode === 'buzzer') {
          resetBuzzer();
          reset(r2TimerDuration);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [round2Mode, buzzerStatus, openBuzzer, resetBuzzer, start, reset, r2TimerDuration]);

  const checkAnswer = (i: number) => {
    if (answered || !question) return;
    const isCorrect = i === question.correctIndex;
    setSelectedIndex(i);
    const pts = question.points ?? CORRECT_POINTS;

    // Award overall game score
    awardScore('round2', isCorrect ? pts : WRONG_POINTS);

    // If candidate buzzed, award candidate individual score
    if (activeRecord) {
      awardCandidateScore(activeRecord.candidateId, isCorrect ? pts : WRONG_POINTS);
    }

    if (isCorrect) {
      sfx.correct();
      fireMarigoldBurst();
    } else {
      sfx.wrong();
    }
  };

  useEffect(() => {
    usePresenterActions.getState().register({
      onNext: () => {
        sfx.navigate();
        if (r2Index >= bank.round2.length - 1) {
          goToRound('scoreboard');
        } else {
          nextR2();
        }
      },
      onPrev: () => {
        sfx.navigate();
        prevR2();
      },
      onStartTimer: () => {
        sfx.click();
        start();
      },
      onPauseTimer: () => {
        sfx.click();
        pause();
      },
    });
    return () => usePresenterActions.getState().clear();
  }, [r2Index]);

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cream/60 font-body">No questions loaded. Add some via Manage Data on the dashboard.</p>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen flex flex-col justify-between ${stageMode ? 'pt-4 pb-4' : 'pt-20 pb-6'} px-4 sm:px-8 max-w-[1800px] mx-auto gap-4 select-none`}>
      {/* Top Header Card */}
      <div className="w-full glass rounded-2xl px-5 py-3 border border-marigold/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl shrink-0">
        <div className="flex items-center gap-3">
          <span className="brass-divider w-8" />
          <span className="text-gradient-saffron font-bold text-sm uppercase tracking-widest">
            Round 2 · {round2Mode === 'buzzer' ? '⚡ Audition Fastest Finger Buzzer' : 'Standard Multiple Choice'}
          </span>
          <span className="brass-divider w-8" />
          <span className="text-marigold font-score text-xs px-3 py-1 rounded-full bg-white/10 border border-marigold/30 font-bold">
            Question {r2Index + 1} of {bank.round2.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="glass rounded-xl p-1 flex gap-1 border border-white/10">
            <button
              onClick={() => setRound2Mode('buzzer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-score flex items-center gap-1.5 transition-all ${
                round2Mode === 'buzzer' ? 'bg-gradient-to-r from-saffron-500 to-marigold text-slate-950 font-bold shadow-md' : 'text-cream/60 hover:text-cream'
              }`}
            >
              <Zap size={14} /> Buzzer Round
            </button>
            <button
              onClick={() => setRound2Mode('standard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-score transition-all ${
                round2Mode === 'standard' ? 'bg-gradient-to-r from-saffron-500 to-marigold text-slate-950 font-bold shadow-md' : 'text-cream/60 hover:text-cream'
              }`}
            >
              Standard MCQ
            </button>
          </div>

          {/* Roster & QR buttons */}
          <button
            onClick={() => setShowCandidateManager(true)}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-marigold border-marigold/40 hover:bg-marigold/10"
          >
            <Users size={14} /> 250+ Candidates
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-cream/80 hover:bg-white/10"
          >
            <QrCode size={14} /> Mobile QR
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel, Question Card, Host Live Feed */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 w-full min-h-0">
        {/* Left Column: Timer & Buzzer Controls */}
        <div className="w-full lg:w-60 xl:w-64 glass rounded-3xl p-5 border border-marigold/40 shadow-glow flex flex-col items-center gap-4 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shrink-0">
          <DiyaTimer secondsLeft={secondsLeft} totalSeconds={r2TimerDuration} running={running} size={140} />
          
          <div className="flex gap-1.5 w-full justify-center">
            {[30, 45, 60].map((d) => (
              <button
                key={d}
                onClick={() => setR2TimerDuration(d as 30 | 45 | 60)}
                className={`px-3 py-1 rounded-xl text-xs font-score transition-all ${
                  r2TimerDuration === d
                    ? 'bg-gradient-to-r from-saffron-500 to-marigold text-slate-950 font-bold shadow-md'
                    : 'glass text-cream/50 hover:text-cream'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full justify-center">
            <button onClick={running ? pause : start} className="btn-secondary p-3 rounded-2xl flex-1 flex justify-center">
              {running ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button onClick={() => reset(r2TimerDuration)} className="btn-secondary p-3 rounded-2xl flex-1 flex justify-center">
              <RefreshCcw size={18} />
            </button>
          </div>

          {/* Buzzer Specific Controls */}
          {round2Mode === 'buzzer' && (
            <div className="flex flex-col gap-2 w-full mt-2 pt-2 border-t border-white/10">
              {buzzerStatus === 'idle' ? (
                <button
                  onClick={() => {
                    openBuzzer();
                    start();
                  }}
                  className="btn-primary py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-glow animate-pulse w-full"
                >
                  <Zap size={18} fill="currentColor" /> Open Buzzer (Space)
                </button>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  {buzzerStatus === 'open' && (
                    <button
                      onClick={lockBuzzer}
                      className="btn-secondary py-2.5 text-xs text-amber-400 border-amber-400/40 flex items-center justify-center gap-1.5 hover:bg-amber-400/10 w-full font-bold"
                    >
                      <Lock size={14} /> Lock Buzzer Now
                    </button>
                  )}
                  <button
                    onClick={() => {
                      resetBuzzer();
                      reset(r2TimerDuration);
                    }}
                    className="btn-secondary py-2.5 text-xs text-kumkum border-kumkum/40 flex items-center justify-center gap-1.5 w-full font-bold"
                  >
                    <RotateCcw size={14} /> Reset Buzzer (R)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center Column: Question Card & Options Grid */}
        <div className="flex-1 w-full flex flex-col justify-center gap-5 sm:gap-6 min-w-0 my-auto">
          {round2Mode === 'buzzer' && <BuzzerLockoutBanner />}

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col justify-center gap-5 sm:gap-6"
            >
              {/* Rich Glowing Spiritual Question Box */}
              <div className="relative glass rounded-3xl p-8 sm:p-10 border-2 border-marigold/40 shadow-2xl bg-gradient-to-b from-night-soft/95 via-slate-900/90 to-night-deep/95 overflow-hidden flex flex-col justify-center min-h-[220px]">
                {/* Background ambient radial glow */}
                <div className="absolute inset-0 bg-radial-glow opacity-70 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col gap-4 text-center items-center justify-center my-auto">
                  <div className="flex items-center justify-center gap-2">
                    {question.category && (
                      <span className="text-xs font-score px-3 py-1 rounded-full bg-saffron-500/20 text-marigold-light border border-marigold/40 font-bold uppercase tracking-wider">
                        {question.category}
                      </span>
                    )}
                    {question.difficulty && (
                      <span className="text-xs font-score px-3 py-1 rounded-full bg-white/10 text-cream/70 capitalize font-medium">
                        {question.difficulty}
                      </span>
                    )}
                    <span className="text-xs font-score px-3 py-1 rounded-full bg-emerald/20 text-emerald-300 border border-emerald/40 font-bold">
                      +{question.points ?? CORRECT_POINTS} Points
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-relaxed sm:leading-tight text-cream drop-shadow-[0_4px_20px_rgba(255,167,51,0.35)] tracking-wide max-w-4xl mx-auto py-2">
                    {question.question}
                  </h2>
                </div>
              </div>

              {/* High-Contrast Vibrant Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {question.options.map((opt, i) => {
                  const isCorrect = i === question.correctIndex;
                  const isSelected = selectedIndex === i;
                  const dim = answered && !isCorrect && !isSelected;
                  const showWrongSelected = answered && isSelected && !isCorrect;
                  return (
                    <motion.button
                      key={i}
                      disabled={answered}
                      whileHover={!answered ? { scale: 1.02, y: -3 } : {}}
                      whileTap={!answered ? { scale: 0.98 } : {}}
                      onClick={() => checkAnswer(i)}
                      className={`relative glass rounded-2xl p-5 sm:p-6 flex items-center gap-5 text-left transition-all duration-300 border-2 ${
                        dim
                          ? 'opacity-30 border-transparent bg-white/[0.02]'
                          : 'opacity-100 border-white/15 bg-gradient-to-r from-white/[0.07] via-white/[0.04] to-white/[0.07] hover:border-marigold/60 hover:shadow-glow hover:bg-white/[0.12]'
                      } ${answered && isCorrect ? 'shadow-glow-green border-emerald/80 bg-emerald/20 text-white' : ''} ${
                        showWrongSelected ? 'shadow-glow-red border-kumkum/80 bg-kumkum/20 text-white' : ''
                      }`}
                    >
                      <span
                        className={`font-score font-bold text-xl sm:text-2xl h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                          answered && isCorrect
                            ? 'bg-emerald text-white'
                            : showWrongSelected
                            ? 'bg-kumkum text-white'
                            : 'bg-gradient-to-tr from-saffron-500 to-marigold text-slate-950 font-bold'
                        }`}
                      >
                        {letters[i]}
                      </span>
                      <span className="font-body text-xl sm:text-2xl font-bold text-cream leading-snug flex-1">
                        {opt}
                      </span>
                      {answered && isCorrect && <CheckCircle2 className="text-emerald shrink-0 animate-bounce" size={28} />}
                      {showWrongSelected && <XCircle className="text-kumkum shrink-0" size={28} />}
                    </motion.button>
                  );
                })}
              </div>

              {answered && question.explanation && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                  <div className="glass p-4 rounded-2xl border border-marigold/40 bg-saffron-500/10">
                    <p className="text-sm text-cream/90 font-body">
                      <span className="text-marigold font-bold">Explanation: </span>
                      {question.explanation}
                    </p>
                  </div>
                </motion.div>
              )}

              {answered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mt-1"
                >
                  {selectedIndex === question.correctIndex ? (
                    <span className="text-emerald font-bold text-lg bg-emerald/10 border border-emerald/30 px-6 py-2 rounded-full inline-block">
                      🎉 Correct Answer! +{question.points ?? CORRECT_POINTS} points awarded {activeRecord ? `to ${activeRecord.candidateName}` : ''}.
                    </span>
                  ) : (
                    <span className="text-kumkum font-bold text-lg bg-kumkum/10 border border-kumkum/30 px-6 py-2 rounded-full inline-block">
                      ❌ Incorrect Answer. 0 points.
                    </span>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Host Live Feed Panel */}
        {round2Mode === 'buzzer' && (
          <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col justify-start">
            <HostBuzzerFeedPanel />
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="w-full glass rounded-2xl px-6 py-3 border border-white/10 flex items-center justify-between shrink-0 shadow-xl">
        <button
          onClick={() => {
            sfx.navigate();
            prevR2();
          }}
          disabled={r2Index === 0}
          className="btn-secondary py-2.5 px-5 text-xs font-score font-bold flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft size={18} /> Previous Question
        </button>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.navigate();
              nextR2();
            }}
            disabled={r2Index >= bank.round2.length - 1}
            className="btn-primary py-2.5 px-6 text-sm font-bold flex items-center gap-2"
          >
            Next Question <ChevronRight size={18} />
          </button>
          {r2Index >= bank.round2.length - 1 && (
            <button
              onClick={() => {
                sfx.navigate();
                goToRound('scoreboard');
              }}
              className="btn-primary py-2.5 px-6 text-sm font-bold flex items-center gap-2 bg-gradient-to-r from-emerald to-green-600"
            >
              <Trophy size={18} /> Finish Quiz · View Results
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCandidateManager && <CandidateManagerModal onClose={() => setShowCandidateManager(false)} />}
      {showQRModal && <BuzzerQRCodeModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}

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
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
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
    resetBuzzer,
    awardScore,
    awardCandidateScore,
    goToRound,
  } = useGameStore();

  const question = bank.round2[r2Index];
  const { secondsLeft, running, start, pause, reset } = useCountdown(r2TimerDuration);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 gap-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-score uppercase tracking-widest text-marigold/70 w-full max-w-6xl justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="brass-divider w-8" />
          Round 2 · {round2Mode === 'buzzer' ? '⚡ Audition Fastest Finger Buzzer' : 'Standard Multiple Choice'}
          <span className="brass-divider w-8" />
          <span className="text-cream/40">
            Q{r2Index + 1} / {bank.round2.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="glass rounded-xl p-1 flex gap-1 border border-white/10">
            <button
              onClick={() => setRound2Mode('buzzer')}
              className={`px-3 py-1 rounded-lg text-xs font-score flex items-center gap-1.5 transition-all ${
                round2Mode === 'buzzer' ? 'bg-saffron-500 text-white font-bold' : 'text-cream/50 hover:text-cream'
              }`}
            >
              <Zap size={14} /> Buzzer Round
            </button>
            <button
              onClick={() => setRound2Mode('standard')}
              className={`px-3 py-1 rounded-lg text-xs font-score transition-all ${
                round2Mode === 'standard' ? 'bg-saffron-500 text-white font-bold' : 'text-cream/50 hover:text-cream'
              }`}
            >
              Standard MCQ
            </button>
          </div>

          {/* Roster & QR buttons */}
          <button
            onClick={() => setShowCandidateManager(true)}
            className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 text-marigold border-marigold/40"
          >
            <Users size={14} /> 250+ Candidates
          </button>
          <button
            onClick={() => setShowQRModal(true)}
            className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5 text-cream/70"
          >
            <QrCode size={14} /> Mobile QR
          </button>
        </div>
      </div>

      {/* Main Grid: Presenter View & Host Live Feed */}
      <div className="flex flex-col lg:flex-row items-start gap-8 w-full max-w-7xl">
        {/* Left Side: Timer & Controls */}
        <div className="flex flex-col items-center gap-4 shrink-0 mx-auto lg:mx-0">
          <DiyaTimer secondsLeft={secondsLeft} totalSeconds={r2TimerDuration} running={running} size={150} />
          <div className="flex gap-2">
            {[30, 45, 60].map((d) => (
              <button
                key={d}
                onClick={() => setR2TimerDuration(d as 30 | 45 | 60)}
                className={`px-2.5 py-1 rounded-lg text-xs font-score ${
                  r2TimerDuration === d ? 'bg-saffron-500 text-white' : 'glass text-cream/50'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={running ? pause : start} className="btn-secondary p-2.5 rounded-xl">
              {running ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={() => reset(r2TimerDuration)} className="btn-secondary p-2.5 rounded-xl">
              <RefreshCcw size={16} />
            </button>
          </div>

          {/* Buzzer Specific Controls */}
          {round2Mode === 'buzzer' && (
            <div className="flex flex-col gap-2 w-full mt-2">
              {buzzerStatus === 'idle' ? (
                <button
                  onClick={() => {
                    openBuzzer();
                    start();
                  }}
                  className="btn-primary py-3 text-sm flex items-center justify-center gap-2 shadow-glow animate-pulse"
                >
                  <Zap size={18} fill="currentColor" /> Open Buzzer (Space)
                </button>
              ) : (
                <button
                  onClick={() => {
                    resetBuzzer();
                    reset(r2TimerDuration);
                  }}
                  className="btn-secondary py-2.5 text-xs text-kumkum border-kumkum/40 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} /> Reset Buzzer (R)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Question Card & Lockout Banner */}
        <div className="flex-1 w-full flex flex-col gap-6">
          {round2Mode === 'buzzer' && <BuzzerLockoutBanner />}

          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 40, rotateY: -8 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <GlassCard arch className="p-8 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  {question.category && (
                    <span className="text-xs font-score px-2.5 py-1 rounded-full bg-white/10 text-marigold">
                      {question.category}
                    </span>
                  )}
                  {question.difficulty && (
                    <span className="text-xs font-score px-2.5 py-1 rounded-full bg-white/5 text-cream/50 capitalize">
                      {question.difficulty}
                    </span>
                  )}
                  <span className="text-xs font-score px-2.5 py-1 rounded-full bg-emerald/10 text-emerald">
                    Correct +{question.points ?? CORRECT_POINTS} · Wrong +{WRONG_POINTS}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl leading-snug text-cream">{question.question}</h2>
              </GlassCard>

              <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-3">
                Select Option to Evaluate Answer:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.options.map((opt, i) => {
                  const isCorrect = i === question.correctIndex;
                  const isSelected = selectedIndex === i;
                  const dim = answered && !isCorrect && !isSelected;
                  const showWrongSelected = answered && isSelected && !isCorrect;
                  return (
                    <motion.button
                      key={i}
                      disabled={answered}
                      whileHover={!answered ? { scale: 1.02, y: -2 } : {}}
                      animate={answered && isCorrect ? { scale: [1, 1.04, 1], transition: { duration: 0.6 } } : {}}
                      onClick={() => checkAnswer(i)}
                      className={`glass rounded-2xl p-5 flex items-center gap-4 text-left transition-opacity duration-500 ${
                        dim ? 'opacity-30' : 'opacity-100'
                      } ${answered && isCorrect ? 'shadow-glow-green border-emerald/50' : ''} ${
                        showWrongSelected ? 'shadow-glow-red border-kumkum/50' : ''
                      }`}
                    >
                      <span
                        className={`font-score font-bold text-lg h-9 w-9 flex items-center justify-center rounded-full shrink-0 ${
                          answered && isCorrect
                            ? 'bg-emerald text-white'
                            : showWrongSelected
                            ? 'bg-kumkum text-white'
                            : 'bg-white/10 text-cream/70'
                        }`}
                      >
                        {letters[i]}
                      </span>
                      <span className="font-body text-lg text-cream/90 flex-1">{opt}</span>
                      {answered && isCorrect && <CheckCircle2 className="text-emerald shrink-0" size={22} />}
                      {showWrongSelected && <XCircle className="text-kumkum shrink-0" size={22} />}
                    </motion.button>
                  );
                })}
              </div>

              {answered && question.explanation && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <GlassCard className="p-4">
                    <p className="text-sm text-cream/70 font-body">
                      <span className="text-marigold font-semibold">Explanation: </span>
                      {question.explanation}
                    </p>
                  </GlassCard>
                </motion.div>
              )}

              {answered && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm font-score text-center"
                >
                  {selectedIndex === question.correctIndex ? (
                    <span className="text-emerald font-semibold">
                      Correct Answer! +{question.points ?? CORRECT_POINTS} points awarded {activeRecord ? `to ${activeRecord.candidateName}` : ''}.
                    </span>
                  ) : (
                    <span className="text-kumkum font-semibold">
                      Incorrect Answer. +{WRONG_POINTS} points.
                    </span>
                  )}
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Host Live Feed Panel of Every Buzzer Press */}
        {round2Mode === 'buzzer' && (
          <div className="shrink-0 w-full lg:w-auto">
            <HostBuzzerFeedPanel />
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => {
            sfx.navigate();
            prevR2();
          }}
          disabled={r2Index === 0}
          className="btn-secondary flex items-center gap-1.5"
        >
          <ChevronLeft size={18} /> Previous
        </button>
        <button
          onClick={() => {
            sfx.navigate();
            nextR2();
          }}
          disabled={r2Index >= bank.round2.length - 1}
          className="btn-primary flex items-center gap-1.5"
        >
          Next Question <ChevronRight size={18} />
        </button>
        {r2Index >= bank.round2.length - 1 && (
          <button
            onClick={() => {
              sfx.navigate();
              goToRound('scoreboard');
            }}
            className="btn-primary flex items-center gap-1.5"
          >
            <Trophy size={18} /> Finish Quiz · View Results
          </button>
        )}
      </div>

      {/* Modals */}
      {showCandidateManager && <CandidateManagerModal onClose={() => setShowCandidateManager(false)} />}
      {showQRModal && <BuzzerQRCodeModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}

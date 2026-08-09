import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, Upload, Award, ImageIcon, Plus, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { usePresenterActions } from '../store/usePresenterActions';
import { useCountdown } from '../hooks/useCountdown';
import GlassCard from '../components/GlassCard';
import DiyaTimer from '../components/DiyaTimer';
import { fireMarigoldBurst } from '../components/MarigoldConfetti';
import { sfx } from '../utils/sound';
import { compressImageToDataUrl } from '../utils/image';
import type { ImageQuestion } from '../types';

const emptyDraft = (): ImageQuestion => ({
  id: `img-${Date.now()}`,
  image: '',
  question: '',
  correctAnswer: '',
  points: 15,
});

export default function Round1Picture() {
  const { bank, setBank, r1Index, r1Revealed, nextR1, prevR1, revealR1, goToR1, goToRound, awardScore } =
    useGameStore();
  const question = bank.round1[r1Index];
  const { secondsLeft, running, start, reset } = useCountdown(45);
  const [scoreGranted, setScoreGranted] = useState<boolean | null>(null);
  const [showAddForm, setShowAddForm] = useState(bank.round1.length === 0);
  const [draft, setDraft] = useState<ImageQuestion>(emptyDraft());
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerStartedRef = useRef(false);

  // Reset timer and start it automatically when question changes
  useEffect(() => {
    reset(45);
    setScoreGranted(null);
    timerStartedRef.current = false;
    // Start timer automatically when question loads and is not revealed yet
    if (!r1Revealed) {
      start();
      timerStartedRef.current = true;
    }
  }, [r1Index]);

  // Start timer when question is revealed
  useEffect(() => {
    if (r1Revealed && !timerStartedRef.current) {
      start();
      timerStartedRef.current = true;
    }
  }, [r1Revealed]);

  useEffect(() => {
    if (bank.round1.length === 0) setShowAddForm(true);
  }, [bank.round1.length]);

  const reveal = () => {
    if (!question || r1Revealed) return;
    revealR1();
    sfx.reveal();
    fireMarigoldBurst();
    if (!timerStartedRef.current) {
      start();
      timerStartedRef.current = true;
    }
  };

  useEffect(() => {
    usePresenterActions.getState().register({
      onNext: () => {
        sfx.navigate();
        if (r1Revealed && r1Index >= bank.round1.length - 1) {
          goToRound('round2');
        } else {
          nextR1();
        }
      },
      onPrev: () => {
        sfx.navigate();
        prevR1();
      },
      onReveal: reveal,
      onStartTimer: () => {
        if (!timerStartedRef.current) {
          start();
          timerStartedRef.current = true;
        }
      },
    });
    return () => usePresenterActions.getState().clear();
  }, [r1Index, r1Revealed, question]);

  const saveDraft = () => {
    if (!draft.image || !draft.question.trim() || !draft.correctAnswer.trim()) {
      sfx.wrong();
      return;
    }
    try {
      const nextBank = { ...bank, round1: [...bank.round1, draft] };
      setBank(nextBank);
      sfx.correct();
      const newIndex = nextBank.round1.length - 1;
      setDraft(emptyDraft());
      setShowAddForm(false);
      setImageError('');
      goToR1(newIndex);
    } catch {
      sfx.wrong();
      setImageError(
        'Could not save that question — the browser may be out of storage space. Try removing an older question or using a smaller image.'
      );
    }
  };

  const onPickImage = async (file: File) => {
    setImageBusy(true);
    setImageError('');
    try {
      const compressed = await compressImageToDataUrl(file);
      setDraft((d) => ({ ...d, image: compressed }));
    } catch {
      setImageError('Could not process that image — try a different file.');
    } finally {
      setImageBusy(false);
    }
  };

  if (showAddForm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-6">
        <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
          <span className="brass-divider w-8" />
          Round 1 · Picture Question
          <span className="brass-divider w-8" />
        </div>

        <GlassCard arch className="p-8 w-full max-w-lg space-y-4">
          <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
            Step 1 · Upload the image
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPickImage(file);
              e.target.value = '';
            }}
          />
          {draft.image ? (
            <div className="relative">
              <img src={draft.image} alt="Question" className="w-full max-h-56 object-contain rounded-2xl bg-black/20" />
              <button
                onClick={() => setDraft((d) => ({ ...d, image: '' }))}
                className="absolute top-2 right-2 bg-black/60 hover:bg-kumkum text-white rounded-full p-1.5"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={imageBusy}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-white/15 disabled:opacity-50"
            >
              <Upload size={18} /> {imageBusy ? 'Processing image…' : 'Upload Image'}
            </button>
          )}
          {imageError && <p className="text-xs text-kumkum">{imageError}</p>}

          <p className="text-xs font-score uppercase tracking-wide text-marigold/80 pt-2">
            Step 2 · Write the question
          </p>
          <textarea
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            placeholder="What does this image depict?"
            rows={2}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
          />

          <p className="text-xs font-score uppercase tracking-wide text-marigold/80 pt-2">
            Step 3 · Write the correct answer
          </p>
          <input
            value={draft.correctAnswer}
            onChange={(e) => setDraft({ ...draft, correctAnswer: e.target.value })}
            placeholder="Correct answer (shown after you click Reveal)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
          />

          <div className="grid grid-cols-2 gap-2 items-center pt-1">
            <input
              type="number"
              value={draft.points}
              onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
              placeholder="Points"
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
            />
            <span className="text-xs text-cream/40">points for a correct answer</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={saveDraft}
              disabled={imageBusy}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} /> Add Question & Show It
            </button>
            {bank.round1.length > 0 && (
              <button onClick={() => setShowAddForm(false)} className="btn-secondary px-4">
                Cancel
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-cream/60 font-body">No picture questions loaded yet.</p>
      </div>
    );
  }

  const pts = question.points ?? 15;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24 gap-8">
      <div className="flex items-center gap-3 text-xs font-score uppercase tracking-widest text-marigold/70">
        <span className="brass-divider w-8" />
        Round 1 · Picture Question
        <span className="brass-divider w-8" />
        <span className="text-cream/40">
          {r1Index + 1} / {bank.round1.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xl"
        >
          <GlassCard arch glow="saffron" className="p-8 flex flex-col items-center gap-5">
            {question.image ? (
              <img
                src={question.image}
                alt="Question"
                className="w-full max-h-72 object-contain rounded-2xl bg-black/20"
              />
            ) : (
              <div className="w-full h-40 rounded-2xl bg-white/5 flex items-center justify-center text-cream/30">
                <ImageIcon size={32} />
              </div>
            )}

            <h2 className="font-display text-2xl text-cream text-center leading-snug">{question.question}</h2>

            <DiyaTimer secondsLeft={secondsLeft} totalSeconds={30} running={running} size={110} />

            <AnimatePresence>
              {r1Revealed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <p className="text-xs uppercase tracking-widest text-cream/40 mb-1">The correct answer is</p>
                  <h2 className="font-display text-3xl text-gradient-saffron font-bold">{question.correctAnswer}</h2>
                </motion.div>
              )}
            </AnimatePresence>

            {!r1Revealed ? (
              <button onClick={reveal} className="btn-primary flex items-center gap-2">
                <Eye size={18} /> Reveal Answer
              </button>
            ) : (
              <>
                <div className="w-full text-center">
                  <p className="text-xs font-score uppercase tracking-widest text-cream/40 mb-2">
                    Score Evaluation:
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => {
                        if (scoreGranted !== true) {
                          awardScore('round1', scoreGranted === false ? pts : pts);
                          setScoreGranted(true);
                          sfx.correct();
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-score flex items-center gap-1.5 transition-all ${
                        scoreGranted === true ? 'bg-emerald text-white shadow-glow-green' : 'glass text-emerald hover:bg-emerald/10'
                      }`}
                    >
                      <Award size={16} /> Correct (+{pts} pts)
                    </button>
                    <button
                      onClick={() => {
                        if (scoreGranted === true) {
                          awardScore('round1', -pts);
                        }
                        setScoreGranted(false);
                        sfx.wrong();
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-score flex items-center gap-1.5 transition-all ${
                        scoreGranted === false ? 'bg-kumkum text-white' : 'glass text-cream/60 hover:text-cream'
                      }`}
                    >
                      Incorrect (+0 pts)
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      sfx.navigate();
                      prevR1();
                    }}
                    disabled={r1Index === 0}
                    className="btn-secondary flex items-center gap-1.5"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                  {r1Index >= bank.round1.length - 1 ? (
                    <>
                      <button
                        onClick={() => {
                          sfx.navigate();
                          goToRound('round2');
                        }}
                        className="btn-primary flex items-center gap-1.5"
                      >
                        Proceed to Round 2 · MCQ <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="btn-secondary flex items-center gap-1.5"
                      >
                        <Plus size={18} /> Add Question
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        sfx.navigate();
                        nextR1();
                      }}
                      className="btn-primary flex items-center gap-1.5"
                    >
                      Next Question <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
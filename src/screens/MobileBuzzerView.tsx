import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, User } from 'lucide-react';
import { buzzerSync, type SyncMessage } from '../utils/buzzerSync';
import AmbientBackground from '../components/AmbientBackground';
import OmSymbol from '../components/OmSymbol';
import { sfx } from '../utils/sound';

export default function MobileBuzzerView() {
  const [participantName, setParticipantName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [buzzerStatus, setBuzzerStatus] = useState<'idle' | 'open' | 'locked'>('idle');
  const [myPressRank, setMyPressRank] = useState<number | null>(null);
  const [myResponseTime, setMyResponseTime] = useState<number | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState('');

  useEffect(() => {
    // Generate or restore candidate ID
    const storedId = localStorage.getItem('audition_candidate_id');
    const storedName = localStorage.getItem('audition_candidate_name');
    const storedSeat = localStorage.getItem('audition_candidate_seat');

    if (storedId) setCandidateId(storedId);
    else {
      const newId = `cand-mob-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('audition_candidate_id', newId);
      setCandidateId(newId);
    }

    if (storedName) {
      setParticipantName(storedName);
      if (storedSeat) setSeatNumber(storedSeat);
      setIsRegistered(true);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = buzzerSync.subscribe((msg: SyncMessage) => {
      if (msg.type === 'BUZZER_STATE_UPDATE') {
        setBuzzerStatus(msg.payload.status);
        if (msg.payload.status === 'open') {
          setMyPressRank(null);
          setMyResponseTime(null);
          setWinnerName(null);
        }
      } else if (msg.type === 'RESET_BUZZER') {
        setBuzzerStatus('idle');
        setMyPressRank(null);
        setMyResponseTime(null);
        setWinnerName(null);
      } else if (msg.type === 'PRESS_BUZZER') {
        const record = msg.payload;
        if (record.rank === 1) {
          setBuzzerStatus('locked');
          setWinnerName(record.candidateName);
        }
        if (record.candidateId === candidateId) {
          setMyPressRank(record.rank);
          setMyResponseTime(record.responseTimeMs);
        }
      }
    });

    return unsubscribe;
  }, [candidateId]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) return;
    localStorage.setItem('audition_candidate_name', participantName.trim());
    if (seatNumber.trim()) localStorage.setItem('audition_candidate_seat', seatNumber.trim());
    setIsRegistered(true);
    sfx.click();
  };

  const handleBuzzerPress = () => {
    if (!isRegistered || myPressRank !== null) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(100);
      } catch (e) {}
    }

    sfx.buzzerPress();

    buzzerSync.send({
      type: 'PRESS_BUZZER',
      payload: {
        candidateId,
        candidateName: participantName,
        seatNumber: seatNumber || 'Mobile User',
      },
    });
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-marigold font-score text-xs uppercase tracking-widest">
          <OmSymbol size={16} /> Audition Fast Finger Buzzer <OmSymbol size={16} />
        </div>

        {!isRegistered ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full glass rounded-3xl p-6 border border-marigold/40 shadow-2xl flex flex-col gap-4"
          >
            <div className="h-16 w-16 rounded-full bg-saffron-500/20 text-marigold flex items-center justify-center mx-auto">
              <User size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold text-cream">Enter Participant Name</h2>
            <p className="text-xs font-body text-cream/70">
              Join 250+ candidates in the live audition quiz!
            </p>

            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Full Name (Required)"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream text-center focus:outline-none focus:border-marigold font-body"
              />
              <input
                type="text"
                placeholder="Seat Number / Candidate ID (Optional)"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-cream text-center focus:outline-none focus:border-marigold font-score"
              />
              <button type="submit" className="btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center gap-2 mt-2">
                <Zap size={18} fill="currentColor" /> Join Audition Room
              </button>
            </form>
          </motion.div>
        ) : (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="flex items-center justify-between w-full glass rounded-2xl px-4 py-2 text-xs font-score text-cream/70">
              <span className="text-marigold font-bold truncate">{participantName}</span>
              <button
                onClick={() => setIsRegistered(false)}
                className="text-cream/40 hover:text-cream underline text-[10px]"
              >
                Change Name
              </button>
            </div>

            {/* Giant Shiny Buzzer Button */}
            <div className="relative my-4">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleBuzzerPress}
                disabled={buzzerStatus !== 'open' || myPressRank !== null}
                className={`w-64 h-64 rounded-full flex flex-col items-center justify-center gap-2 font-display transition-all duration-300 shadow-2xl relative border-4 ${
                  myPressRank === 1
                    ? 'bg-gradient-to-tr from-emerald to-green-400 border-white text-white shadow-glow-green scale-105'
                    : myPressRank !== null
                    ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-white/40 text-white'
                    : buzzerStatus === 'open'
                    ? 'bg-gradient-to-tr from-red-600 via-kumkum to-saffron-500 border-marigold text-white shadow-glow cursor-pointer animate-pulse'
                    : 'bg-slate-800/80 border-white/10 text-cream/30 opacity-60'
                }`}
              >
                <Zap size={56} fill="currentColor" />
                <span className="text-2xl font-bold uppercase tracking-wider">
                  {myPressRank === 1
                    ? 'YOU ARE FIRST! 🎉'
                    : myPressRank !== null
                    ? `RANK #${myPressRank}`
                    : buzzerStatus === 'open'
                    ? 'PRESS NOW!'
                    : 'BUZZER LOCKED'}
                </span>
                {myResponseTime !== null && (
                  <span className="text-xs font-score opacity-90">{(myResponseTime / 1000).toFixed(3)}s</span>
                )}
              </motion.button>
            </div>

            {/* Status Feedback */}
            <div className="w-full">
              {myPressRank === 1 ? (
                <div className="glass p-4 rounded-2xl border border-emerald/50 bg-emerald/10 text-emerald text-sm font-score font-bold">
                  🎉 Congratulations {participantName}! You buzzed 1st in {(myResponseTime! / 1000).toFixed(3)}s! Get ready to answer!
                </div>
              ) : myPressRank !== null ? (
                <div className="glass p-4 rounded-2xl border border-marigold/30 text-marigold text-xs font-score">
                  Recorded Rank #{myPressRank} ({(myResponseTime! / 1000).toFixed(3)}s). Waiting for host...
                </div>
              ) : winnerName ? (
                <div className="glass p-4 rounded-2xl text-cream/70 text-xs font-score">
                  🔒 Locked by <span className="text-marigold font-bold">{winnerName}</span>!
                </div>
              ) : buzzerStatus === 'open' ? (
                <div className="glass p-4 rounded-2xl border border-emerald/50 text-emerald text-sm font-score animate-pulse font-bold">
                  🟢 Buzzers Active! Tap the big button as fast as you can!
                </div>
              ) : (
                <div className="glass p-4 rounded-2xl text-cream/40 text-xs font-score">
                  Waiting for host to open buzzers for next question...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

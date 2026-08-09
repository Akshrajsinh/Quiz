import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, User, Wifi, WifiOff, RefreshCw, Trophy, Award } from 'lucide-react';
import { buzzerSync, type SyncMessage, type ConnectionStatus } from '../utils/buzzerSync';
import AmbientBackground from '../components/AmbientBackground';
import OmSymbol from '../components/OmSymbol';
import { sfx, unlockAudio } from '../utils/sound';

export default function MobileBuzzerView() {
  const [participantName, setParticipantName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [buzzerStatus, setBuzzerStatus] = useState<'idle' | 'open' | 'locked'>('idle');
  const [myPressRank, setMyPressRank] = useState<number | null>(null);
  const [myResponseTime, setMyResponseTime] = useState<number | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState('');
  const [isPressSent, setIsPressSent] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connecting');
  const [roomCode, setRoomCode] = useState('GYAN-LIVE');

  // Refs to prevent stale closure issues inside event listeners
  const candidateIdRef = useRef(candidateId);
  candidateIdRef.current = candidateId;

  const participantNameRef = useRef(participantName);
  participantNameRef.current = participantName;

  useEffect(() => {
    // Read room parameter from URL if provided (e.g. ?mode=buzzer&room=GYAN-888)
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      const code = urlRoom.trim().toUpperCase();
      buzzerSync.setRoomCode(code);
      setRoomCode(code);
    } else {
      setRoomCode(buzzerSync.getRoomCode());
    }

    const unsubStatus = buzzerSync.onStatusChange((status) => {
      setConnStatus(status);
    });

    // Generate or restore candidate ID
    const storedId = localStorage.getItem('audition_candidate_id');
    const storedName = localStorage.getItem('audition_candidate_name');
    const storedSeat = localStorage.getItem('audition_candidate_seat');

    let currentId = storedId;
    if (storedId) {
      setCandidateId(storedId);
    } else {
      currentId = `cand-mob-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('audition_candidate_id', currentId);
      setCandidateId(currentId);
    }

    if (storedName) {
      setParticipantName(storedName);
      if (storedSeat) setSeatNumber(storedSeat);
      setIsRegistered(true);

      // Announce candidate join to host
      buzzerSync.send({
        type: 'JOIN_CANDIDATE',
        payload: {
          candidateId: currentId,
          candidateName: storedName,
          seatNumber: storedSeat || 'Mobile Candidate',
        },
      });
    }

    return () => {
      unsubStatus();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = buzzerSync.subscribe((msg: SyncMessage) => {
      if (msg.type === 'BUZZER_STATE_UPDATE') {
        setBuzzerStatus(msg.payload.status);
        if (msg.payload.status === 'open') {
          setMyPressRank(null);
          setMyResponseTime(null);
          setWinnerName(null);
          setIsPressSent(false);
        }
      } else if (msg.type === 'RESET_BUZZER') {
        setBuzzerStatus('idle');
        setMyPressRank(null);
        setMyResponseTime(null);
        setWinnerName(null);
        setIsPressSent(false);
      } else if (msg.type === 'PRESS_BUZZER') {
        const record = msg.payload;

        if (record.rank === 1) {
          setBuzzerStatus('locked');
          setWinnerName(record.candidateName);
        }

        const activeId = candidateIdRef.current || localStorage.getItem('audition_candidate_id');
        const activeName = participantNameRef.current || localStorage.getItem('audition_candidate_name');

        const isMe =
          (record.candidateId && activeId && record.candidateId === activeId) ||
          (record.candidateName && activeName && record.candidateName.trim().toLowerCase() === activeName.trim().toLowerCase());

        if (isMe) {
          setMyPressRank(record.rank);
          setMyResponseTime(record.responseTimeMs);
          setIsPressSent(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantName.trim()) return;

    unlockAudio();
    const cleanName = participantName.trim();
    const cleanSeat = seatNumber.trim();

    localStorage.setItem('audition_candidate_name', cleanName);
    if (cleanSeat) localStorage.setItem('audition_candidate_seat', cleanSeat);
    setIsRegistered(true);
    sfx.click();

    // Announce to host
    buzzerSync.send({
      type: 'JOIN_CANDIDATE',
      payload: {
        candidateId,
        candidateName: cleanName,
        seatNumber: cleanSeat || 'Mobile Candidate',
      },
    });
  };

  const handleBuzzerPress = () => {
    if (!isRegistered || myPressRank !== null || isPressSent || buzzerStatus !== 'open') return;

    unlockAudio();

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(120);
      } catch (e) {}
    }

    sfx.buzzerPress();
    setIsPressSent(true);

    const activeId = candidateId || localStorage.getItem('audition_candidate_id') || `cand-mob-${Date.now()}`;

    buzzerSync.send({
      type: 'PRESS_BUZZER',
      payload: {
        candidateId: activeId,
        candidateName: participantName,
        seatNumber: seatNumber || 'Mobile User',
      },
    });
  };

  return (
    <div
      onClick={unlockAudio}
      className="min-h-screen w-full relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
    >
      <AmbientBackground />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-5">
        {/* Header Title */}
        <div className="flex items-center gap-2 text-marigold font-score text-xs uppercase tracking-widest">
          <OmSymbol size={16} /> Audition Live Mobile Buzzer <OmSymbol size={16} />
        </div>

        {/* Room & Network Connection Status Bar */}
        <div className="flex items-center justify-between w-full glass rounded-xl px-3 py-1.5 text-[11px] font-score text-cream/70 border border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-marigold font-bold">Room: {roomCode}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {connStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-emerald font-semibold">
                <Wifi size={12} /> Connected Live
              </span>
            ) : connStatus === 'connecting' ? (
              <span className="flex items-center gap-1 text-amber-400 animate-pulse font-semibold">
                <RefreshCw size={12} className="animate-spin" /> Syncing...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <WifiOff size={12} /> Offline (Local Sync)
              </span>
            )}
          </div>
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
            <h2 className="font-display text-2xl font-bold text-cream">Enter Candidate Name</h2>
            <p className="text-xs font-body text-cream/70">
              Join live audition quiz! When host opens buzzer, your screen will activate instantly.
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
          <div className="w-full flex flex-col items-center gap-5">
            {/* Candidate Header Bar */}
            <div className="flex items-center justify-between w-full glass rounded-2xl px-4 py-2 text-xs font-score text-cream/70">
              <span className="text-marigold font-bold truncate">{participantName} {seatNumber ? `(${seatNumber})` : ''}</span>
              <button
                onClick={() => setIsRegistered(false)}
                className="text-cream/40 hover:text-cream underline text-[10px]"
              >
                Edit Name
              </button>
            </div>

            {/* Prominent Rank Display Badge if buzzed */}
            {myPressRank !== null && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full py-3 px-4 rounded-2xl border-2 flex items-center justify-between shadow-2xl ${
                  myPressRank === 1
                    ? 'bg-gradient-to-r from-emerald/30 to-green-500/30 border-emerald text-emerald'
                    : 'bg-gradient-to-r from-marigold/30 to-saffron-500/30 border-marigold text-marigold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-slate-950 font-bold font-score text-base ${
                    myPressRank === 1 ? 'bg-emerald text-white' : 'bg-marigold text-slate-950'
                  }`}>
                    #{myPressRank}
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] font-score uppercase tracking-widest opacity-80">Official Buzzer Rank</div>
                    <div className="text-lg font-bold font-display leading-none">
                      {myPressRank === 1 ? '🎉 1ST PLACE WINNER!' : `RANK #${myPressRank} FASTEST FINGER`}
                    </div>
                  </div>
                </div>
                {myResponseTime !== null && (
                  <div className="text-right font-score">
                    <span className="text-xs opacity-70 block">Time</span>
                    <span className="text-sm font-bold">{(myResponseTime / 1000).toFixed(3)}s</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Giant Shiny Buzzer Button */}
            <div className="relative my-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleBuzzerPress}
                disabled={buzzerStatus !== 'open' || myPressRank !== null || isPressSent}
                className={`w-64 h-64 rounded-full flex flex-col items-center justify-center gap-2 font-display transition-all duration-300 shadow-2xl relative border-4 ${
                  myPressRank === 1
                    ? 'bg-gradient-to-tr from-emerald to-green-400 border-white text-white shadow-glow-green scale-105'
                    : myPressRank !== null
                    ? 'bg-gradient-to-tr from-amber-600 to-yellow-500 border-white/40 text-white'
                    : isPressSent
                    ? 'bg-gradient-to-tr from-yellow-600 to-amber-500 border-marigold text-white animate-pulse'
                    : buzzerStatus === 'open'
                    ? 'bg-gradient-to-tr from-red-600 via-kumkum to-saffron-500 border-marigold text-white shadow-glow cursor-pointer animate-pulse scale-105'
                    : 'bg-slate-800/80 border-white/10 text-cream/30 opacity-60'
                }`}
              >
                {myPressRank === 1 ? (
                  <Trophy size={60} className="text-yellow-200 animate-bounce" />
                ) : myPressRank !== null ? (
                  <Award size={60} className="text-white" />
                ) : (
                  <Zap size={56} fill="currentColor" />
                )}

                <span className="text-2xl font-bold uppercase tracking-wider px-2 text-center">
                  {myPressRank === 1
                    ? 'YOU ARE 1ST! 🎉'
                    : myPressRank !== null
                    ? `RANK #${myPressRank}`
                    : isPressSent
                    ? 'REGISTERING...'
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
                  🎉 Congratulations {participantName}! You buzzed 1st in {(myResponseTime! / 1000).toFixed(3)}s! Get ready to answer on stage!
                </div>
              ) : myPressRank !== null ? (
                <div className="glass p-4 rounded-2xl border border-marigold/30 text-marigold text-xs font-score">
                  Recorded Rank #{myPressRank} ({(myResponseTime! / 1000).toFixed(3)}s). Waiting for host...
                </div>
              ) : isPressSent ? (
                <div className="glass p-4 rounded-2xl border border-yellow-500/50 text-yellow-300 text-sm font-score animate-pulse font-bold">
                  ⚡ Press registered! Calculating rank on host system...
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
                  Waiting for host to click "OPEN BUZZER" for next question...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

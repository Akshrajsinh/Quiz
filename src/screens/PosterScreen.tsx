import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize, QrCode, Play, Flame, Zap, Trophy, Sparkles, Tv } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import MandalaRing from '../components/MandalaRing';
import OmSymbol from '../components/OmSymbol';
import GlassCard from '../components/GlassCard';
import BuzzerQRCodeModal from '../components/BuzzerQRCodeModal';
import { buzzerSync } from '../utils/buzzerSync';
import { sfx } from '../utils/sound';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

export default function PosterScreen() {
  const { eventName, subtitle, candidates, goToRound, startEvent } = useGameStore();
  const [showQRModal, setShowQRModal] = useState(false);
  const [roomCode, setRoomCode] = useState('GYAN-LIVE');
  const [pureStageMode, setPureStageMode] = useState(false);

  useEffect(() => {
    setRoomCode(buzzerSync.getRoomCode());
  }, []);

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between items-center px-4 sm:px-8 py-12 text-center select-none overflow-hidden ${pureStageMode ? 'z-50 bg-night fixed inset-0' : ''}`}>
      {/* Background Animated Mandala Ring */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 scale-125">
        <MandalaRing size={800} />
      </div>

      {/* Background Decorative Diya Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-saffron-500/20 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-marigold/20 rounded-full blur-[140px]" />

      {/* Top Banner / Pure Mode Controls */}
      <div className="relative z-10 w-full max-w-6xl flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-xs font-score uppercase tracking-[0.25em] text-marigold/80">
          <Flame size={18} className="text-saffron-400 animate-pulse" />
          <span>Official Stage Event Poster</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.click();
              setPureStageMode(!pureStageMode);
            }}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-marigold border-marigold/40 hover:bg-marigold/10"
          >
            <Tv size={14} /> {pureStageMode ? 'Exit Pure Poster Mode' : 'Pure Poster View'}
          </button>
          <button
            onClick={() => {
              sfx.click();
              toggleFullscreen();
            }}
            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-cream/80"
          >
            <Maximize size={14} /> Fullscreen (F)
          </button>
        </div>
      </div>

      {/* Main Poster Hero Banner Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center max-w-5xl mx-auto my-auto py-8"
      >
        {/* Sacred Header Badge */}
        <div className="mb-6 flex items-center justify-center gap-4 text-marigold font-score text-sm sm:text-base tracking-[0.35em] uppercase font-bold">
          <span className="brass-divider w-12 sm:w-20" />
          <OmSymbol size={26} className="text-brass animate-pulse" />
          <span>PRESENTER EDITION</span>
          <OmSymbol size={26} className="text-brass animate-pulse" />
          <span className="brass-divider w-12 sm:w-20" />
        </div>

        {/* Grand Title Text */}
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-gradient-saffron drop-shadow-[0_8px_35px_rgba(255,107,26,0.5)] tracking-wider leading-none mb-4">
          {eventName || 'HARI PRABODHAM'}
        </h1>

        {/* Subtitle */}
        <p className="font-body text-xl sm:text-3xl text-cream/90 font-medium tracking-wide drop-shadow-md max-w-3xl">
          {subtitle || 'A Spiritual Quiz Celebration'}
        </p>

        <p className="mt-2 font-display text-lg sm:text-2xl text-marigold/90 tracking-widest font-semibold">
          એક દિવ્ય આધ્યાત્મિક ક્વિઝ મહોત્સવ
        </p>

        {/* Live Event Details Card */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <GlassCard className="p-4 text-center border-marigold/30 bg-white/[0.04]">
            <span className="text-[10px] font-score uppercase tracking-widest text-cream/50 block">Audition Room</span>
            <span className="font-score text-xl font-bold text-marigold">{roomCode}</span>
          </GlassCard>

          <GlassCard className="p-4 text-center border-marigold/30 bg-white/[0.04]">
            <span className="text-[10px] font-score uppercase tracking-widest text-cream/50 block">Live Candidates</span>
            <span className="font-score text-xl font-bold text-gradient-saffron">{candidates.length}+ Registered</span>
          </GlassCard>

          <GlassCard className="p-4 text-center border-marigold/30 bg-white/[0.04]">
            <span className="text-[10px] font-score uppercase tracking-widest text-cream/50 block">Buzzer Round</span>
            <span className="font-score text-xl font-bold text-emerald">10 Buzz Limit Active</span>
          </GlassCard>
        </div>
      </motion.div>

      {/* Quiz Rounds Overview & QR Action Cards */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5 my-4"
      >
        <GlassCard className="p-5 text-left border-marigold/20 hover:border-marigold/60 transition-all">
          <div className="flex items-center gap-3 mb-2 text-marigold">
            <Sparkles size={20} />
            <h3 className="font-display text-lg font-bold">Round 1 · Picture Quiz</h3>
          </div>
          <p className="text-xs font-body text-cream/70 leading-relaxed">
            Spiritual image identification challenge with instant score rewards.
          </p>
        </GlassCard>

        <GlassCard className="p-5 text-left border-marigold/20 hover:border-marigold/60 transition-all bg-saffron-500/10">
          <div className="flex items-center gap-3 mb-2 text-saffron-400">
            <Zap size={20} />
            <h3 className="font-display text-lg font-bold">Round 2 · Fastest Finger</h3>
          </div>
          <p className="text-xs font-body text-cream/70 leading-relaxed">
            Audition Mobile Buzzer System. Up to 10 candidates buzz in real time!
          </p>
        </GlassCard>

        <GlassCard className="p-5 text-left border-marigold/20 hover:border-marigold/60 transition-all">
          <div className="flex items-center gap-3 mb-2 text-emerald">
            <Trophy size={20} />
            <h3 className="font-display text-lg font-bold">Scoreboard & Champion</h3>
          </div>
          <p className="text-xs font-body text-cream/70 leading-relaxed">
            Live scoreboards, total points leaderboard, and Gyan winner celebration.
          </p>
        </GlassCard>
      </motion.div>

      {/* Action Buttons Footer */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 w-full max-w-2xl pt-4">
        <button
          onClick={() => {
            sfx.fanfare();
            startEvent();
            goToRound('round1');
          }}
          className="btn-primary py-4 px-8 text-lg font-bold flex items-center justify-center gap-3 shadow-glow hover:scale-105"
        >
          <Play size={22} fill="currentColor" /> Start Gyan Challenge Quiz
        </button>

        <button
          onClick={() => {
            sfx.click();
            goToRound('round2');
          }}
          className="btn-secondary py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 border-marigold/40 text-marigold hover:bg-marigold/10"
        >
          <Zap size={18} fill="currentColor" /> Open Buzzer Round 2
        </button>

        <button
          onClick={() => setShowQRModal(true)}
          className="btn-secondary py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 text-cream/80 hover:bg-white/10"
        >
          <QrCode size={18} /> Show Mobile QR Code
        </button>
      </div>

      {/* Mobile QR Code Modal */}
      {showQRModal && <BuzzerQRCodeModal onClose={() => setShowQRModal(false)} />}
    </div>
  );
}

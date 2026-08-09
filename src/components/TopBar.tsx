import { useState, useEffect } from 'react';
import { Maximize, Minimize, HelpCircle, Flame } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import ShortcutsOverlay from './ShortcutsOverlay';
import RoundRulesModal from './RoundRulesModal';
import OmSymbol from './OmSymbol';
import { sfx } from '../utils/sound';
import type { RoundKey } from '../types';

type PlayableRound = 'round1' | 'round2';
const playableRounds: PlayableRound[] = ['round1', 'round2'];

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

const navItems: { id: RoundKey; label: string }[] = [
  { id: 'dashboard', label: 'Home' },
  { id: 'poster', label: 'Poster' },
  { id: 'round1', label: 'Round 1' },
  { id: 'round2', label: 'Round 2' },
  { id: 'scoreboard', label: 'Scoreboard' },
];

export default function TopBar() {
  const currentRound = useGameStore((s) => s.currentRound);
  const eventName = useGameStore((s) => s.eventName);
  const goToRound = useGameStore((s) => s.goToRound);
  const stageMode = useGameStore((s) => s.stageMode);
  const setStageMode = useGameStore((s) => s.setStageMode);
  const toggleStageMode = useGameStore((s) => s.toggleStageMode);

  const [showHelp, setShowHelp] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const [pendingRound, setPendingRound] = useState<PlayableRound | null>(null);

  useEffect(() => {
    const handleFsChange = () => {
      const fsActive = !!document.fullscreenElement;
      setIsFs(fsActive);
      setStageMode(fsActive);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [setStageMode]);

  const navigate = (id: RoundKey) => {
    if (playableRounds.includes(id as PlayableRound)) {
      sfx.click();
      setPendingRound(id as PlayableRound);
      return;
    }
    sfx.navigate();
    goToRound(id);
  };

  return (
    <>
      {/* Top Bar Container - Slides up in Fullscreen Stage Mode */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 group ${
          stageMode ? '-translate-y-[calc(100%-8px)] hover:translate-y-0' : 'translate-y-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 glass border-b border-white/10 backdrop-blur-2xl bg-night-soft/90 shadow-2xl">
          <button
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2 font-display text-base sm:text-lg text-cream/90 hover:text-marigold transition-colors shrink-0"
          >
            <Flame size={20} className="text-saffron-400" />
            <span className="hidden sm:inline">{eventName}</span>
          </button>

          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-score whitespace-nowrap transition-colors ${
                  currentRound === item.id ? 'text-white bg-saffron-600/80 shadow-glow font-bold' : 'text-cream/60 hover:text-cream hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0">
            <OmSymbol size={18} className="hidden lg:inline text-brass/60 mr-1" />
            <button
              onClick={() => setShowHelp(true)}
              className="btn-ghost p-2 rounded-xl hover:bg-white/10"
              title="Keyboard shortcuts"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={() => {
                sfx.click();
                toggleFullscreen();
              }}
              className="btn-ghost p-2 rounded-xl hover:bg-white/10 text-marigold"
              title={isFs ? 'Exit Full Screen' : 'Enter Full Screen Presenter View'}
            >
              {isFs ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        {/* Floating Indicator Handle in Stage Mode */}
        {stageMode && (
          <div
            onClick={toggleStageMode}
            className="mx-auto w-48 text-center bg-gradient-to-r from-saffron-500 to-marigold text-slate-950 text-[10px] font-score font-bold py-1 px-3 rounded-b-xl shadow-glow cursor-pointer opacity-80 group-hover:opacity-0 transition-opacity"
          >
            ▲ Hover or Click to Show Menu
          </div>
        )}
      </div>
      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      {pendingRound && (
        <RoundRulesModal
          round={pendingRound}
          onStart={() => {
            sfx.navigate();
            goToRound(pendingRound);
            setPendingRound(null);
          }}
          onClose={() => setPendingRound(null)}
        />
      )}
    </>
  );
}


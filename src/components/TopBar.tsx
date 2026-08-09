import { useState } from 'react';
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
  { id: 'round1', label: 'Round 1' },
  { id: 'round2', label: 'Round 2' },
  { id: 'scoreboard', label: 'Scoreboard' },
];

export default function TopBar() {
  const currentRound = useGameStore((s) => s.currentRound);
  const eventName = useGameStore((s) => s.eventName);
  const goToRound = useGameStore((s) => s.goToRound);
  const [showHelp, setShowHelp] = useState(false);
  const [isFs, setIsFs] = useState(!!document.fullscreenElement);
  const [pendingRound, setPendingRound] = useState<PlayableRound | null>(null);

  document.onfullscreenchange = () => setIsFs(!!document.fullscreenElement);

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
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 glass border-b border-white/10">
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
                currentRound === item.id ? 'text-white bg-saffron-600/80 shadow-glow' : 'text-cream/55 hover:text-cream hover:bg-white/5'
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
            className="btn-ghost p-2 rounded-xl hover:bg-white/5"
            title="Keyboard shortcuts"
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => {
              sfx.click();
              toggleFullscreen();
            }}
            className="btn-ghost p-2 rounded-xl hover:bg-white/5"
            title="Full Screen (F)"
          >
            {isFs ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
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


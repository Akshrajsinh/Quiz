import { useEffect } from 'react';
import { usePresenterActions } from '../store/usePresenterActions';
import { useGameStore } from '../store/useGameStore';
import { sfx, unlockAudio } from '../utils/sound';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

export function useKeyboardShortcuts() {
  const goToRound = useGameStore((s) => s.goToRound);
  const currentRound = useGameStore((s) => s.currentRound);

  useEffect(() => {
    let unlocked = false;
    const handler = (e: KeyboardEvent) => {
      if (!unlocked) {
        unlockAudio();
        unlocked = true;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const { handlers } = usePresenterActions.getState();

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          handlers.onNext?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlers.onPrev?.();
          break;
        case ' ':
          e.preventDefault();
          sfx.click();
          handlers.onReveal?.();
          break;
        case 't':
        case 'T':
          handlers.onStartTimer?.();
          break;
        case 'p':
        case 'P':
          handlers.onPauseTimer?.();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 's':
        case 'S':
          if (currentRound !== 'scoreboard') goToRound('scoreboard');
          else goToRound('dashboard');
          break;
        case 'Escape':
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentRound, goToRound]);
}

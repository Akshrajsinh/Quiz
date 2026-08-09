import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import AmbientBackground from './components/AmbientBackground';
import TopBar from './components/TopBar';
import Dashboard from './screens/Dashboard';
import Round1Picture from './screens/Round1Picture';
import Round2MCQ from './screens/Round2MCQ';
import Scoreboard from './screens/Scoreboard';
import MobileBuzzerView from './screens/MobileBuzzerView';

const screens = {
  dashboard: Dashboard,
  round1: Round1Picture,
  round2: Round2MCQ,
  scoreboard: Scoreboard,
};

function App() {
  useKeyboardShortcuts();
  const currentRound = useGameStore((s) => s.currentRound);
  const [isMobileBuzzer, setIsMobileBuzzer] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=buzzer')) {
      setIsMobileBuzzer(true);
    }
  }, []);

  if (isMobileBuzzer) {
    return <MobileBuzzerView />;
  }

  const Screen = screens[currentRound];

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AmbientBackground />
      <TopBar />
      <div className="relative z-10 h-screen w-full overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRound}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;


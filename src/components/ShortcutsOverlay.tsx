import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const shortcuts = [
  ['→', 'Next question / step'],
  ['←', 'Previous question'],
  ['Space', 'Reveal answer'],
  ['T', 'Start timer'],
  ['P', 'Pause timer'],
  ['F', 'Toggle full screen'],
  ['S', 'Open / close scoreboard'],
  ['Esc', 'Exit full screen'],
];

export default function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-3xl p-8 w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl text-gradient-saffron">Presenter Shortcuts</h2>
            <button onClick={onClose} className="text-cream/60 hover:text-cream">
              <X size={22} />
            </button>
          </div>
          <div className="space-y-2.5">
            {shortcuts.map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-cream/70 font-body">{desc}</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 font-score text-cream/90 min-w-[2.5rem] text-center">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

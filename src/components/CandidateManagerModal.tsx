import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, UserPlus, Upload, Trash2, Trophy, Search, Award } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface Props {
  onClose: () => void;
}

export default function CandidateManagerModal({ onClose }: Props) {
  const { candidates, addCandidate, importCandidates, removeCandidate, clearCandidates } = useGameStore();

  const [activeTab, setActiveTab] = useState<'roster' | 'bulk' | 'leaderboard'>('roster');
  const [name, setName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCandidate(name, seatNumber);
    setName('');
    setSeatNumber('');
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const parsed = lines.map((line, idx) => {
      const parts = line.split(/[,;\t]/);
      const nameVal = parts[0]?.trim() || `Candidate ${idx + 1}`;
      const seatVal = parts[1]?.trim() || `Seat #${idx + 1}`;
      return { name: nameVal, seatNumber: seatVal };
    });
    importCandidates(parsed);
    setBulkText('');
    setActiveTab('roster');
  };

  const handleGenerate250 = () => {
    const list = Array.from({ length: 250 }, (_, i) => ({
      name: `Participant ${i + 1}`,
      seatNumber: `Seat #${i + 1}`,
    }));
    importCandidates(list);
    setActiveTab('roster');
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.seatNumber && c.seatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedLeaderboard = [...candidates].sort((a, b) => b.score - a.score || b.totalBuzzerWins - a.totalBuzzerWins);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl glass rounded-3xl p-6 border border-marigold/40 shadow-2xl flex flex-col gap-6 max-h-[85vh] overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Users className="text-marigold" size={28} />
            <div>
              <h2 className="font-display text-2xl text-cream font-bold">250+ Audition Candidates Roster</h2>
              <p className="text-xs text-cream/50 font-body">Manage participant names, seat IDs, and live score rankings</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-cream/60">
            <X size={22} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-3 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-score flex items-center gap-2 transition-all ${
              activeTab === 'roster' ? 'bg-saffron-500 text-white font-bold' : 'glass text-cream/70 hover:text-cream'
            }`}
          >
            <Users size={16} /> Candidate Roster ({candidates.length})
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-xl text-xs font-score flex items-center gap-2 transition-all ${
              activeTab === 'bulk' ? 'bg-saffron-500 text-white font-bold' : 'glass text-cream/70 hover:text-cream'
            }`}
          >
            <Upload size={16} /> Bulk Add / Import 250+
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-score flex items-center gap-2 transition-all ${
              activeTab === 'leaderboard' ? 'bg-saffron-500 text-white font-bold' : 'glass text-cream/70 hover:text-cream'
            }`}
          >
            <Trophy size={16} /> Audition Leaderboard
          </button>
        </div>

        {/* Tab 1: Candidate Roster List */}
        {activeTab === 'roster' && (
          <div className="flex flex-col gap-4 overflow-hidden flex-1">
            <form onSubmit={handleAddSingle} className="flex gap-2">
              <input
                type="text"
                placeholder="Participant Name (e.g. Ramesh Patel)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream focus:outline-none focus:border-marigold"
              />
              <input
                type="text"
                placeholder="Seat # (Optional)"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value)}
                className="w-32 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-cream focus:outline-none focus:border-marigold"
              />
              <button type="submit" className="btn-primary px-4 text-xs flex items-center gap-1.5 shrink-0">
                <UserPlus size={16} /> Add Candidate
              </button>
            </form>

            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-2.5 text-cream/40" />
                <input
                  type="text"
                  placeholder="Search among candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-cream focus:outline-none focus:border-marigold"
                />
              </div>
              {candidates.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all candidates from roster?')) clearCandidates();
                  }}
                  className="text-xs text-kumkum hover:underline flex items-center gap-1 shrink-0"
                >
                  <Trash2 size={14} /> Clear Roster
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pr-1 no-scrollbar max-h-80">
              {filteredCandidates.length === 0 ? (
                <div className="col-span-full py-12 text-center text-cream/40 text-sm font-body">
                  No candidates added yet. Click "Bulk Add / Import 250+" or enter a name above!
                </div>
              ) : (
                filteredCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl glass border border-white/10 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <p className="font-body text-sm font-semibold text-cream truncate">{c.name}</p>
                      <p className="text-[10px] font-score text-cream/50">
                        {c.seatNumber || 'No Seat'} · {c.score} Pts · {c.totalBuzzerWins} Buzz Wins
                      </p>
                    </div>
                    <button
                      onClick={() => removeCandidate(c.id)}
                      className="text-cream/30 hover:text-kumkum p-1.5 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Bulk Import */}
        {activeTab === 'bulk' && (
          <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-body text-cream/70">
                Paste 250+ Participant Names below (one name per line, or comma-separated name, seat):
              </p>
              <button
                onClick={handleGenerate250}
                className="btn-secondary py-1.5 px-3 text-xs text-marigold border-marigold/40 flex items-center gap-1.5"
              >
                ⚡ Auto-Generate 250 Audition Test Candidates
              </button>
            </div>

            <textarea
              rows={8}
              placeholder="Rameshbhai Patel, Seat A-101&#10;Jignesh Shah, Seat A-102&#10;Suresh Varma, Seat B-205&#10;Priya Dave, Seat C-301..."
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono text-cream focus:outline-none focus:border-marigold"
            />

            <button onClick={handleBulkImport} className="btn-primary py-3 text-sm flex items-center justify-center gap-2">
              <Upload size={18} /> Process & Import Participant Names
            </button>
          </div>
        )}

        {/* Tab 3: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
            <span className="text-xs font-score text-marigold uppercase tracking-wider">
              Audition Candidates Score & Buzzer Ranking
            </span>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
              {sortedLeaderboard.map((c, i) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-2xl flex items-center justify-between text-xs glass ${
                    i === 0
                      ? 'border border-marigold bg-marigold/10 text-marigold font-bold'
                      : i === 1
                      ? 'border border-slate-300 bg-white/10 text-cream font-bold'
                      : i === 2
                      ? 'border border-amber-700 bg-white/5 text-cream font-bold'
                      : 'text-cream/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-score text-sm font-bold w-6 text-center">#{i + 1}</span>
                    <div>
                      <p className="font-body text-sm font-semibold">{c.name}</p>
                      {c.seatNumber && <p className="text-[10px] opacity-60">{c.seatNumber}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 font-score">
                    <span className="flex items-center gap-1 text-marigold">
                      <Award size={14} /> {c.score} Pts
                    </span>
                    <span className="opacity-60">{c.totalBuzzerWins} Buzz Wins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

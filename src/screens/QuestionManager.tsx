import { useRef, useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import {
  X,
  Upload,
  Download,
  Plus,
  Trash2,
  Save,
  PencilLine,
  ImageIcon,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import type { ImageQuestion, MCQQuestion } from '../types';
import { sfx } from '../utils/sound';
import { compressImageToDataUrl } from '../utils/image';

const emptyPicture = (): ImageQuestion => ({
  id: `img-${Date.now()}`,
  image: '',
  question: '',
  correctAnswer: '',
  points: 15,
});

const emptyMCQ = (): MCQQuestion => ({
  id: `q-${Date.now()}`,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  category: '',
  difficulty: 'medium',
  points: 10,
});

function parseCsvToQuestions(text: string) {
  // Expected columns: question,optionA,optionB,optionC,optionD,correctIndex,explanation,category,difficulty,points
  const lines = text.trim().split(/\r?\n/);
  const [, ...rows] = lines; // skip header
  return rows
    .filter((r) => r.trim().length > 0)
    .map((row, i) => {
      const cols = row.split(',').map((c) => c.trim());
      return {
        id: `import-${Date.now()}-${i}`,
        question: cols[0] ?? '',
        options: [cols[1] ?? '', cols[2] ?? '', cols[3] ?? '', cols[4] ?? ''] as [string, string, string, string],
        correctIndex: (Number(cols[5]) || 0) as 0 | 1 | 2 | 3,
        explanation: cols[6] ?? '',
        category: cols[7] ?? '',
        difficulty: (cols[8] as any) ?? 'medium',
        points: Number(cols[9]) || 10,
      };
    });
}

export default function QuestionManager({ onClose }: { onClose: () => void }) {
  const { bank, setBank, eventName, subtitle, setEventMeta } = useGameStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'pictures' | 'questions' | 'import' | 'event'>('pictures');
  const [localName, setLocalName] = useState(eventName);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [importMsg, setImportMsg] = useState('');

  // Dynamic forms
  const [pictureDraft, setPictureDraft] = useState<ImageQuestion>(emptyPicture());
  const pictureFileRef = useRef<HTMLInputElement>(null);
  const [editingPictureId, setEditingPictureId] = useState<string | null>(null);

  const [mcqDraft, setMcqDraft] = useState<MCQQuestion>(emptyMCQ());
  const [editingMcqId, setEditingMcqId] = useState<string | null>(null);

  const savePicture = () => {
    if (!pictureDraft.image || !pictureDraft.question.trim() || !pictureDraft.correctAnswer.trim()) {
      sfx.wrong();
      setImportMsg('Please upload an image, and fill in the question and correct answer.');
      return;
    }
    try {
      if (editingPictureId) {
        setBank({ ...bank, round1: bank.round1.map((p) => (p.id === editingPictureId ? pictureDraft : p)) });
      } else {
        setBank({ ...bank, round1: [...bank.round1, pictureDraft] });
      }
      sfx.correct();
      setPictureDraft(emptyPicture());
      setEditingPictureId(null);
    } catch {
      sfx.wrong();
      setImportMsg(
        'Could not save that question — the browser may be out of storage space. Try removing an older question or using a smaller image.'
      );
    }
  };

  const editPicture = (p: ImageQuestion) => {
    setPictureDraft(p);
    setEditingPictureId(p.id);
  };

  const deletePicture = (id: string) => {
    setBank({ ...bank, round1: bank.round1.filter((p) => p.id !== id) });
    if (editingPictureId === id) {
      setPictureDraft(emptyPicture());
      setEditingPictureId(null);
    }
  };

  const movePicture = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= bank.round1.length) return;
    const list = [...bank.round1];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setBank({ ...bank, round1: list });
    sfx.click();
  };

  const saveMcq = () => {
    if (!mcqDraft.question.trim() || mcqDraft.options.some((o) => !o.trim())) {
      sfx.wrong();
      setImportMsg('Please fill in the question and all four options.');
      return;
    }
    if (editingMcqId) {
      setBank({ ...bank, round2: bank.round2.map((q) => (q.id === editingMcqId ? mcqDraft : q)) });
    } else {
      setBank({ ...bank, round2: [...bank.round2, mcqDraft] });
    }
    sfx.correct();
    setMcqDraft(emptyMCQ());
    setEditingMcqId(null);
  };

  const editMcq = (q: MCQQuestion) => {
    setMcqDraft(q);
    setEditingMcqId(q.id);
  };

  const deleteMcq = (id: string) => {
    setBank({ ...bank, round2: bank.round2.filter((q) => q.id !== id) });
    if (editingMcqId === id) {
      setMcqDraft(emptyMCQ());
      setEditingMcqId(null);
    }
  };

  const moveMcq = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= bank.round2.length) return;
    const list = [...bank.round2];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    setBank({ ...bank, round2: list });
    sfx.click();
  };

  const exportAllQuestions = () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        eventName,
        subtitle,
        round1: bank.round1,
        round2: bank.round2,
      };
      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gyan-challenge-questions-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      sfx.fanfare();
      setImportMsg(`Successfully exported ${bank.round1.length} Round 1 & ${bank.round2.length} Round 2 questions!`);
    } catch {
      sfx.wrong();
      setImportMsg('Could not export questions.');
    }
  };

  const handleFileImport = async (file: File, mode: 'append' | 'replace') => {
    try {
      const text = await file.text();
      let importedR1: ImageQuestion[] = [];
      let importedR2: MCQQuestion[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.round1)) importedR1 = parsed.round1;
        if (Array.isArray(parsed.round2)) importedR2 = parsed.round2;
        // Fallback if flat array or structure
        if (!Array.isArray(parsed.round1) && !Array.isArray(parsed.round2)) {
          if (Array.isArray(parsed)) importedR2 = parsed;
        }
      } else {
        importedR2 = parseCsvToQuestions(text);
      }

      if (importedR1.length === 0 && importedR2.length === 0) {
        setImportMsg('No valid questions found in file.');
        sfx.wrong();
        return;
      }

      if (mode === 'replace') {
        setBank({
          round1: importedR1.length > 0 ? importedR1 : bank.round1,
          round2: importedR2.length > 0 ? importedR2 : bank.round2,
        });
        setImportMsg(
          `Replaced bank with ${importedR1.length} Round 1 & ${importedR2.length} Round 2 questions!`
        );
      } else {
        // Append mode
        setBank({
          round1: [...bank.round1, ...importedR1],
          round2: [...bank.round2, ...importedR2],
        });
        setImportMsg(
          `Added ${importedR1.length} Round 1 & ${importedR2.length} Round 2 new questions to bank!`
        );
      }
      sfx.correct();
    } catch (err) {
      setImportMsg('Could not parse file. Check format and try again.');
      sfx.wrong();
    }
  };

  const downloadTemplate = () => {
    const csv =
      'question,optionA,optionB,optionC,optionD,correctIndex,explanation,category,difficulty,points\n' +
      'Who wrote the Ramayana?,Ved Vyasa,Valmiki,Tulsidas,Kalidasa,1,Valmiki is the traditional author,Scriptures,medium,15\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gyan-challenge-questions-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveEvent = () => {
    setEventMeta(localName, localSubtitle);
    sfx.correct();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-gradient-saffron">Manage Event Data</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['pictures', 'questions', 'import', 'event'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-score capitalize transition-colors ${
                tab === t ? 'bg-saffron-500/90 text-white' : 'glass text-cream/60 hover:text-cream'
              }`}
            >
              {t === 'import'
                ? 'Export / Import Bank'
                : t === 'pictures'
                ? 'Round 1 · Pictures'
                : t === 'questions'
                ? 'Round 2 · MCQ'
                : t}
            </button>
          ))}
        </div>
        {importMsg && (
          <p className="text-sm text-marigold mb-4 text-center font-score font-semibold">{importMsg}</p>
        )}

        {tab === 'pictures' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
                {editingPictureId ? 'Edit picture question' : 'Upload an image and write the question'}
              </p>
              <input
                ref={pictureFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const compressed = await compressImageToDataUrl(file);
                    setPictureDraft((prev) => ({ ...prev, image: compressed }));
                  } catch {
                    setImportMsg('Could not process that image — try a different file.');
                    sfx.wrong();
                  }
                }}
              />
              {pictureDraft.image ? (
                <div className="relative">
                  <img
                    src={pictureDraft.image}
                    alt="Question"
                    className="w-full max-h-48 object-contain rounded-2xl bg-black/20"
                  />
                  <button
                    type="button"
                    onClick={() => setPictureDraft((prev) => ({ ...prev, image: '' }))}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-kumkum text-white rounded-full p-1.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => pictureFileRef.current?.click()}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-white/15"
                >
                  <Upload size={16} /> Upload Image
                </button>
              )}
              <textarea
                value={pictureDraft.question}
                onChange={(e) => setPictureDraft({ ...pictureDraft, question: e.target.value })}
                placeholder="Question text (e.g. What does this image depict?)"
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={pictureDraft.correctAnswer}
                  onChange={(e) => setPictureDraft({ ...pictureDraft, correctAnswer: e.target.value })}
                  placeholder="Correct answer"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
                <input
                  type="number"
                  value={pictureDraft.points}
                  onChange={(e) => setPictureDraft({ ...pictureDraft, points: Number(e.target.value) })}
                  placeholder="Points"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={savePicture} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus size={16} /> {editingPictureId ? 'Save Changes' : 'Add Picture Question'}
                </button>
                {editingPictureId && (
                  <button
                    onClick={() => {
                      setPictureDraft(emptyPicture());
                      setEditingPictureId(null);
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-score uppercase tracking-wide text-cream/40 mb-2">
                {bank.round1.length} picture question{bank.round1.length === 1 ? '' : 's'} in Round 1 · Drag or use arrows to change index
              </p>
              <Reorder.Group
                axis="y"
                values={bank.round1}
                onReorder={(newRound1) => setBank({ ...bank, round1: newRound1 })}
                className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1"
              >
                {bank.round1.map((p, i) => (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 cursor-grab active:cursor-grabbing select-none hover:bg-white/10 transition-colors"
                  >
                    <GripVertical size={16} className="text-cream/40 hover:text-marigold shrink-0" />
                    <span className="text-xs text-cream/40 font-score w-6 shrink-0 font-bold">{i + 1}.</span>
                    {p.image ? (
                      <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <ImageIcon size={16} className="text-cream/30 shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-cream/80 truncate">{p.question || '(untitled)'}</span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i > 0) movePicture(i, i - 1);
                        }}
                        disabled={i === 0}
                        className="text-cream/40 hover:text-marigold disabled:opacity-20 p-1 rounded hover:bg-white/10"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i < bank.round1.length - 1) movePicture(i, i + 1);
                        }}
                        disabled={i === bank.round1.length - 1}
                        className="text-cream/40 hover:text-marigold disabled:opacity-20 p-1 rounded hover:bg-white/10"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          editPicture(p);
                        }}
                        className="text-cream/40 hover:text-marigold p-1 rounded hover:bg-white/10"
                        title="Edit"
                      >
                        <PencilLine size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePicture(p.id);
                        }}
                        className="text-cream/40 hover:text-kumkum p-1 rounded hover:bg-white/10"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="space-y-6">
            <div className="glass rounded-2xl p-5 space-y-3">
              <p className="text-xs font-score uppercase tracking-wide text-marigold/80">
                {editingMcqId ? 'Edit question' : 'Type a new question'}
              </p>
              <textarea
                value={mcqDraft.question}
                onChange={(e) => setMcqDraft({ ...mcqDraft, question: e.target.value })}
                placeholder="Question text…"
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mcqDraft.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      onClick={() => setMcqDraft({ ...mcqDraft, correctIndex: i as 0 | 1 | 2 | 3 })}
                      title="Mark as correct answer"
                      className={`h-8 w-8 shrink-0 rounded-full font-score text-xs font-bold flex items-center justify-center transition-colors ${
                        mcqDraft.correctIndex === i ? 'bg-emerald text-white' : 'bg-white/10 text-cream/50'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <input
                      value={opt}
                      onChange={(e) => {
                        const next = [...mcqDraft.options] as [string, string, string, string];
                        next[i] = e.target.value;
                        setMcqDraft({ ...mcqDraft, options: next });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-cream/40">
                Tap a letter to mark the correct answer (currently {String.fromCharCode(65 + mcqDraft.correctIndex)}).
              </p>
              <textarea
                value={mcqDraft.explanation}
                onChange={(e) => setMcqDraft({ ...mcqDraft, explanation: e.target.value })}
                placeholder="Explanation (optional)"
                rows={2}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none resize-none"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  value={mcqDraft.category}
                  onChange={(e) => setMcqDraft({ ...mcqDraft, category: e.target.value })}
                  placeholder="Category"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
                <select
                  value={mcqDraft.difficulty}
                  onChange={(e) => setMcqDraft({ ...mcqDraft, difficulty: e.target.value as any })}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <input
                  type="number"
                  value={mcqDraft.points}
                  onChange={(e) => setMcqDraft({ ...mcqDraft, points: Number(e.target.value) })}
                  placeholder="Points"
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream text-sm focus:border-saffron-400 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveMcq} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Plus size={16} /> {editingMcqId ? 'Save Changes' : 'Add Question'}
                </button>
                {editingMcqId && (
                  <button
                    onClick={() => {
                      setMcqDraft(emptyMCQ());
                      setEditingMcqId(null);
                    }}
                    className="btn-secondary px-4"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-score uppercase tracking-wide text-cream/40 mb-2">
                {bank.round2.length} question{bank.round2.length === 1 ? '' : 's'} in Round 2 · Drag or use arrows to change index
              </p>
              <Reorder.Group
                axis="y"
                values={bank.round2}
                onReorder={(newRound2) => setBank({ ...bank, round2: newRound2 })}
                className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1"
              >
                {bank.round2.map((q, i) => (
                  <Reorder.Item
                    key={q.id}
                    value={q}
                    className="glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 cursor-grab active:cursor-grabbing select-none hover:bg-white/10 transition-colors"
                  >
                    <GripVertical size={16} className="text-cream/40 hover:text-marigold shrink-0" />
                    <span className="text-xs text-cream/40 font-score w-6 shrink-0 font-bold">{i + 1}.</span>
                    <span className="flex-1 text-sm text-cream/80 truncate">{q.question || '(untitled)'}</span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i > 0) moveMcq(i, i - 1);
                        }}
                        disabled={i === 0}
                        className="text-cream/40 hover:text-marigold disabled:opacity-20 p-1 rounded hover:bg-white/10"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (i < bank.round2.length - 1) moveMcq(i, i + 1);
                        }}
                        disabled={i === bank.round2.length - 1}
                        className="text-cream/40 hover:text-marigold disabled:opacity-20 p-1 rounded hover:bg-white/10"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          editMcq(q);
                        }}
                        className="text-cream/40 hover:text-marigold p-1 rounded hover:bg-white/10"
                        title="Edit"
                      >
                        <PencilLine size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMcq(q.id);
                        }}
                        className="text-cream/40 hover:text-kumkum p-1 rounded hover:bg-white/10"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          </div>
        )}

        {tab === 'import' && (
          <div className="space-y-6">
            {/* Section 1: 1-Click Export */}
            <div className="glass rounded-2xl p-5 border border-marigold/40 space-y-3">
              <div className="flex items-center gap-2 text-marigold font-score text-xs uppercase tracking-wider font-bold">
                <Download size={18} /> 1-Click Export All Questions
              </div>
              <p className="text-xs text-cream/70 font-body">
                Export all {bank.round1.length} Round 1 picture questions and {bank.round2.length} Round 2 MCQ questions into a single backup JSON file.
              </p>
              <button
                onClick={exportAllQuestions}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-glow"
              >
                <Download size={18} /> Export All Questions (.json)
              </button>
            </div>

            {/* Section 2: Import Questions */}
            <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-cream font-score text-xs uppercase tracking-wider font-bold">
                <Upload size={18} className="text-saffron-400" /> Import & Add Questions
              </div>
              <p className="text-xs text-cream/70 font-body">
                Import questions from a JSON backup file or CSV template. Choose whether to append to existing bank or replace all questions.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const mode = confirm(
                      `Click OK to APPEND new questions to existing bank.\nClick CANCEL to REPLACE all existing questions.`
                    )
                      ? 'append'
                      : 'replace';
                    handleFileImport(file, mode);
                  }
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary py-3 text-xs flex items-center justify-center gap-2 text-marigold border-marigold/40"
                >
                  <Plus size={16} /> Import & Append to Bank
                </button>
                <button
                  onClick={downloadTemplate}
                  className="btn-ghost py-3 text-xs flex items-center justify-center gap-2 border border-white/10"
                >
                  <Download size={16} /> Download CSV Template
                </button>
              </div>
            </div>

            <div className="brass-divider" />
            <p className="text-xs text-cream/40 text-center font-score">
              Currently loaded: {bank.round1.length} picture questions · {bank.round2.length} MCQ questions
            </p>
          </div>
        )}

        {tab === 'event' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-cream/50 font-score uppercase tracking-wide">Event Name</label>
              <input
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-cream/50 font-score uppercase tracking-wide">Subtitle</label>
              <input
                value={localSubtitle}
                onChange={(e) => setLocalSubtitle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-cream focus:border-saffron-400 outline-none"
              />
            </div>
            <button onClick={saveEvent} className="btn-primary w-full flex items-center justify-center gap-2">
              <Save size={18} /> Save Event Info
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

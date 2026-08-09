import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, QrCode, Smartphone, ExternalLink, Copy, Check, Edit2 } from 'lucide-react';
import { buzzerSync } from '../utils/buzzerSync';

interface Props {
  onClose: () => void;
}

export default function BuzzerQRCodeModal({ onClose }: Props) {
  const [roomCode, setRoomCode] = useState(() => buzzerSync.getRoomCode());
  const [copied, setCopied] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?mode=buzzer&room=${encodeURIComponent(roomCode)}`
    : '';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(currentUrl)}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRoomCodeChange = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = roomCode.trim().toUpperCase() || 'GYAN-LIVE';
    buzzerSync.setRoomCode(newCode);
    setRoomCode(newCode);
    setIsEditingRoom(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-3xl p-6 border border-marigold/50 shadow-glow text-center flex flex-col items-center gap-4"
      >
        <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-marigold font-score text-sm uppercase tracking-wider font-bold">
            <QrCode size={20} /> Audience Live Mobile Buzzer QR
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-cream/60">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs font-body text-cream/80">
          Audience / Candidates: Scan this QR code on mobile to join live audition & press buzzer!
        </p>

        {/* Room Code Badge */}
        <div className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-2 px-3">
          <span className="text-xs text-cream/60 font-score">Live Sync Room:</span>
          {isEditingRoom ? (
            <form onSubmit={handleRoomCodeChange} className="flex items-center gap-1">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-black/40 border border-marigold rounded px-2 py-0.5 text-xs text-marigold font-bold font-score uppercase w-24 text-center focus:outline-none"
              />
              <button type="submit" className="text-[10px] bg-marigold text-slate-950 px-2 py-1 rounded font-bold">Save</button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-score text-sm font-bold text-marigold tracking-wider">{roomCode}</span>
              <button
                onClick={() => setIsEditingRoom(true)}
                className="p-1 text-cream/40 hover:text-marigold"
                title="Change Room Code"
              >
                <Edit2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-4 rounded-2xl shadow-2xl relative border-2 border-marigold/30">
          <img src={qrImageUrl} alt="Buzzer QR Code" className="w-56 h-56 object-contain" />
        </div>

        {/* Link & Copy */}
        <div className="flex items-center justify-between gap-2 text-xs font-score bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-full text-cream/70">
          <div className="flex items-center gap-1.5 truncate">
            <Smartphone size={14} className="text-marigold shrink-0" />
            <span className="truncate">{currentUrl}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-marigold px-2.5 py-1 rounded-lg shrink-0 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary w-full py-2.5 text-xs font-score flex items-center justify-center gap-2 text-marigold border-marigold/40 hover:bg-marigold/10"
        >
          <ExternalLink size={14} /> Open Mobile Buzzer Tab directly
        </a>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { X, QrCode, Smartphone, ExternalLink } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function BuzzerQRCodeModal({ onClose }: Props) {
  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?mode=buzzer` : '';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-3xl p-6 border border-marigold/50 shadow-glow text-center flex flex-col items-center gap-5"
      >
        <div className="flex items-center justify-between w-full border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-marigold font-score text-sm uppercase tracking-wider font-bold">
            <QrCode size={20} /> Audience Mobile Buzzer QR
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-cream/60">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm font-body text-cream/80">
          Audience / Candidates: Scan this QR code on your mobile phone to enter your <span className="text-marigold font-semibold">Participant Name</span> and press the live buzzer!
        </p>

        <div className="bg-white p-4 rounded-2xl shadow-xl">
          <img src={qrImageUrl} alt="Buzzer QR Code" className="w-56 h-56 object-contain" />
        </div>

        <div className="flex items-center gap-2 text-xs font-score text-cream/50 bg-white/5 px-3 py-2 rounded-xl border border-white/10 w-full justify-center">
          <Smartphone size={14} className="text-marigold" />
          <span>Mobile Link: {currentUrl}</span>
        </div>

        <a
          href={currentUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary w-full py-2.5 text-xs font-score flex items-center justify-center gap-2 text-marigold border-marigold/40"
        >
          <ExternalLink size={14} /> Open Mobile Buzzer Tab directly
        </a>
      </motion.div>
    </div>
  );
}

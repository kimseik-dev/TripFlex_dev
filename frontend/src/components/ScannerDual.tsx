import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload, Image as ImageIcon, RotateCcw, Check, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// v72: 픽셀 기반 평균 색상 추출 유틸리티
function getAverageColor(img: HTMLImageElement, box: number[]): { bg: string, text: string } {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { bg: 'rgba(0,0,0,0.85)', text: 'white' };

    const x = (box[0] / 100) * img.naturalWidth;
    const y = (box[1] / 100) * img.naturalHeight;
    const w = (box[2] / 100) * img.naturalWidth;
    const h = (box[3] / 100) * img.naturalHeight;

    canvas.width = 1; canvas.height = 1;
    ctx.drawImage(img, x, y, w, h, 0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    
    const r = data[0], g = data[1], b = data[2];
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return {
      bg: `rgba(${r}, ${g}, ${b}, 0.95)`,
      text: brightness > 140 ? 'black' : 'white'
    };
  } catch (e) {
    return { bg: 'rgba(0,0,0,0.85)', text: 'white' };
  }
}

// Inner Component for Scrollable View (Simplified for Single View)
function SingleResultView({ label, imgSrc, imgAspectRatio, results, showOverlays, imgRef, bgColor }: any) {
  return (
    <div className="flex-1 flex flex-col relative min-h-0 bg-neutral-900">
      <div className={`absolute top-4 left-4 z-30 px-3 py-1 ${bgColor} text-black text-[10px] font-black rounded-lg shadow-xl backdrop-blur-md`}>
        {label}
      </div>
      <div className="flex-1 overflow-auto scrollbar-hide p-4 flex flex-col items-center">
        <div 
          className="relative shadow-2xl rounded-2xl overflow-hidden bg-black" 
          style={{ aspectRatio: `${imgAspectRatio}`, width: '100%', maxWidth: '100%' }}
        >
          {imgSrc && (
            <img 
               ref={imgRef} 
               src={imgSrc} 
               alt={label} 
               className="w-full h-full block object-contain pointer-events-none" 
               crossOrigin="anonymous" 
            />
          )}
          {showOverlays && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              {results.map((res: any, i: number) => {
                const colors = (imgRef?.current) ? getAverageColor(imgRef.current, res.boundingBox) : { bg: 'rgba(0,0,0,0.85)', text: 'white' };
                return (
                  <div 
                    key={i} 
                    className="absolute pointer-events-none z-50 flex items-center justify-start translate-y-[-50%]"
                    style={{ left: `${res.boundingBox[0]}%`, top: `${res.boundingBox[1] + res.boundingBox[3]/2}%`, width: 'auto', maxWidth: '90%' }}
                  >
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      style={{ backgroundColor: colors.bg, borderColor: colors.text === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }} 
                      className="backdrop-blur-md px-2 py-0.5 rounded-md border shadow-2xl"
                    >
                      <span className="font-bold whitespace-nowrap leading-tight tracking-tight" style={{ fontSize: '11px', color: colors.text }}>
                        {res.translated}
                      </span>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Scanner({ onClose }: { onClose?: () => void }) {
  const [results, setResults] = useState<any[]>([]);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgAspectRatio, setImgAspectRatio] = useState(1);
  const [showOverlays, setShowOverlays] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleCapture = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    processImage(canvas.toDataURL('image/jpeg'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => processImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setIsScanning(true);
    setImgSrc(base64);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setImgAspectRatio(data.aspectRatio || 1);
        setShowOverlays(true);
      }
    } catch (err) {
      alert('분석에 실패했어요.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[200] flex flex-col bg-black overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-black/90 border-b border-white/10 z-[210]">
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><ChevronLeft size={24} /></button>
        <h2 className="text-xs font-black text-white tracking-[0.3em] uppercase opacity-70">Neo Scanner</h2>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {imgSrc ? (
          <SingleResultView 
            label="TRANSLATED VIEW" 
            imgSrc={imgSrc} 
            imgAspectRatio={imgAspectRatio}
            results={results}
            showOverlays={showOverlays}
            bgColor="bg-cyan-400"
            imgRef={imgRef}
          />
        ) : (
          <div className="flex-1 relative bg-neutral-900 flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border border-white/10 rounded-[2.5rem] pointer-events-none mb-20 flex items-center justify-center">
                <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 absolute top-[-2px] left-[-2px]" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 absolute top-[-2px] right-[-2px]" />
                <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 absolute bottom-[-2px] left-[-2px]" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 absolute bottom-[-2px] right-[-2px]" />
            </div>
            <div className="absolute bottom-40 left-0 right-0 text-center">
              <p className="text-white/40 text-[10px] font-black tracking-[0.2em] animate-pulse uppercase">Position menu within frame</p>
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 z-50">
          <button 
             onClick={() => { setResults([]); setImgSrc(null); setShowOverlays(false); }}
             className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center text-gray-400 active:scale-95 transition-all text-[8px] font-bold"
          >
            <RotateCcw size={18} />
          </button>

          <div className="relative group">
              {!imgSrc ? (
                   <div className="flex items-center gap-4">
                      <button onClick={() => fileInputRef.current?.click()} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-cyan-400 flex items-center justify-center active:scale-90 transition-all shadow-xl"><Upload size={24} /></button>
                      <button onClick={handleCapture} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-90 transition-all border-4 border-black/10"><Camera size={32} /></button>
                   </div>
              ) : (
                  <button onClick={() => setShowOverlays(!showOverlays)} className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-2 ${showOverlays ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black border-white/20 text-white'}`}><Maximize2 size={24} /></button>
              )}
          </div>

          <button className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex flex-col items-center justify-center active:scale-95 transition-all text-[8px] font-bold" onClick={() => (imgSrc ? alert('완료!') : null)}>
            <Check size={18} />
          </button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
    </motion.div>
  );
}

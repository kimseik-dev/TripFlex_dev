import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera as CameraIcon, X, Loader2, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

interface ScannerProps {
  onClose: () => void;
}

export default function Scanner({ onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imgAspectRatio, setImgAspectRatio] = useState<number>(3/4); // Default aspect ratio
  const [results, setResults] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'azure' | 'google'>('azure'); // v49 Multi-Engine

  // Initialize Camera
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [capturedImage]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError("카메라를 시작할 수 없어요! 권한을 확인해주세요.");
      logger.error("Camera Error:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const captureAndScan = async () => {
    if (!videoRef.current) return;
    
    setIsScanning(true);
    setError(null);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
    stopCamera();
    
    await processImage(imageData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        await processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsScanning(true);
    try {
      logger.api(`OCR & 번역 요청 시작... (Provider: ${provider})`);
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData, provider }) // Pass provider (v49)
      });

      if (!response.ok) throw new Error("분석에 실패했어요.");
      
      const data = await response.json();
      logger.success("분석 데이터 수신됨!", { items: data.results?.length });
      
      if (data.aspectRatio) {
        setImgAspectRatio(data.aspectRatio);
      }
      
      // Log coordinates for transparency
      if (data.results?.length > 0) {
        logger.info("첫 번째 항목 보정 좌표:", data.results[0].boundingBox);
      }
      
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
      logger.error("Scan Process Error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setResults([]);
    setError(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black lg:inset-y-4 lg:inset-x-[30%] lg:rounded-[3rem] lg:border-[8px] lg:border-gray-900 lg:shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-black/50 backdrop-blur-md z-20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CameraIcon className="w-6 h-6 text-cyan-400" />
          AI 트래블 스캐너
        </h2>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* v49: OCR Engine Selector Toggle */}
      <div className="flex justify-center py-2 bg-black/30 backdrop-blur-sm z-20">
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/20">
          <button 
            onClick={() => { setProvider('azure'); setResults([]); }}
            className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${provider === 'azure' ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'text-white/40 hover:text-white/60'}`}
          >
            Azure
          </button>
          <button 
            onClick={() => { setProvider('google'); setResults([]); }}
            className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${provider === 'google' ? 'bg-[#4285F4] text-white shadow-[0_0_10px_rgba(66,133,244,0.5)]' : 'text-white/40 hover:text-white/60'}`}
          >
            Google
          </button>
        </div>
      </div>

      {/* Viewfinder Area */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center p-4">
        <div className="relative h-full w-full max-h-full overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            /* [PRECISION ANCHORED WRAPPER] 
               The container size MUST match the rendered image size in object-contain mode.
            */
            <div 
              className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10"
              style={{
                aspectRatio: `${imgAspectRatio}`,
                width: imgAspectRatio > (3/4) ? '100%' : 'auto',
                height: imgAspectRatio > (3/4) ? 'auto' : '100%',
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
               <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full block object-contain" // Changed to contain to avoid cropping alignment issues
              />
              
              {/* Overlays - Now showing coordinates per representative's request (v40 Debug) */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                {results.map((res, i) => (
                  <div 
                    key={i}
                    className="absolute pointer-events-none z-50 flex items-center justify-center"
                    style={{
                      /* v59: Double-Wrapper Strategy: Force CSS translate for perfect centering regardless of Framer internal motions */
                      left: `${res.boundingBox[0] + res.boundingBox[2]/2}%`,
                      top: `${res.boundingBox[1] + res.boundingBox[3]/2}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-fit h-fit flex items-center justify-center"
                      style={{
                        padding: '1px 2px',
                        borderRadius: '2px',
                        lineHeight: 1.0,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                      }}
                    >
                      <span className={`font-mono font-black text-center whitespace-nowrap leading-none ${
                        res.laneIdx === 0 ? 'text-cyan-400' : 
                        res.laneIdx === 1 ? 'text-orange-400' : 
                        res.laneIdx === 2 ? 'text-purple-400' : 
                        res.laneIdx === 3 ? 'text-green-400' : 
                        'text-yellow-400'
                      }`} style={{ fontSize: '10px' }}>
                        {/* v58/v59/v60: Multi-Lane Comma-Anchor on Hierarchical X-Segmenter */}
                        {(res.boundingBox[0] + res.boundingBox[2]/2).toFixed(1)},{(res.boundingBox[1] + res.boundingBox[3]/2).toFixed(1)}%
                      </span>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          )}

          {/* Scan Line Animation */}
          {!isScanning && results.length === 0 && !capturedImage && (
            <div className="absolute inset-0 border-2 border-cyan-400/30 pointer-events-none">
              <motion.div 
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_cyan]"
              />
            </div>
          )}

          {/* Loading States & Errors omitted for brevity in write_to_file, but keeping essentials */}
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50"
              >
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <p className="text-white font-bold text-center">AI 분석 중... ✨</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls Container */}
      <div className="p-8 pb-12 bg-black/90 border-t border-white/10 flex flex-col items-center gap-6">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
          >
            <ImageIcon className="w-6 h-6" />
          </button>

          <button 
            onClick={capturedImage ? resetScanner : captureAndScan}
            disabled={isScanning}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-cyan-400 active:scale-95 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              {capturedImage ? <RotateCcw className="w-8 h-8 text-white" /> : <CameraIcon className="w-8 h-8 text-white" />}
            </div>
          </button>

          <div className="w-14" />
        </div>
        <p className="text-gray-400 text-sm font-medium">
          {capturedImage ? "다시 하려면 회전 버튼을!" : "카메라를 눌러 스캔하세요! ✨"}
        </p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </motion.div>
  );
}

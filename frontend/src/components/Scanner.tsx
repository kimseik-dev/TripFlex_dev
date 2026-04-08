import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  RotateCw, 
  X, 
  Zap,
  RefreshCw,
  Maximize2,
  Image as ImageIcon
} from 'lucide-react';
import { TranslationItem } from './scanner/TranslationItem';
import { calculatePushedTop, getProportionalFontSize, calculateFontSizeToFit } from '@/utils/scanner/layoutEngine';
import { extractDominantColors, ColorResult } from '@/utils/scanner/colorEngine';

/**
 * Scanner Component ✨
 * v118: 가독성 끝판왕! 지능형 배치 시스템 도입! 📸🕵️‍♀️🎨🌈🧼🧱
 */

interface ScannerProps {
  onClose: () => void;
}

export default function Scanner({ onClose }: ScannerProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [imgDimensions, setImgDimensions] = useState<{width: number, height: number} | null>(null);
  const [colorMap, setColorMap] = useState<{ [key: number]: ColorResult }>({});
  const [showOverlays, setShowOverlays] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{
    name: string;
    translated: string;
    prices: Array<{ value: string; krw: string }>;
  }>>([]);
  const [showCart, setShowCart] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties & { renderedW?: number, renderedH?: number }>({ inset: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCapturing && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Camera access failed:", err));
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCapturing]);

  const runColorExtraction = (imageElement: HTMLImageElement, ocrResults: any[]) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(imageElement, 0, 0);
    
    const newColorMap: { [key: number]: ColorResult } = {};
    ocrResults.forEach((res, idx) => {
      // v200: 절대 픽셀 기반 bbox를 [x, y, w, h] 형식으로 변환하여 색상 추출 🎨✨
      const [cx, cy, w, h] = res.bbox;
      const x = cx - w / 2;
      const y = cy - h / 2;
      newColorMap[idx] = extractDominantColors(canvas, [x, y, w, h]);
    });
    setColorMap(newColorMap);
  };

  // v300: 클라이언트 사이드 이미지 압축 및 리사이징 로직 추가 📸🕵️‍♀️✨
  // 이미지가 너무 크면 'Failed to fetch' 에러가 날 수 있으므로, 전송 전에 최적화합니다.
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // v300: JPEG 0.8 퀄리티로 압축하여 전성 효율 극대화! 🚀
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        console.log(`v300 Optimized: ${(dataUrl.length / 1024).toFixed(1)}KB -> ${(compressed.length / 1024).toFixed(1)}KB ✨`);
        resolve(compressed);
      };
      img.src = dataUrl;
    });
  };

  const captureImage = async () => {
    if (!videoRef.current) return;
    
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 150);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const rawDataUrl = canvas.toDataURL('image/jpeg');
      
      // v300: 촬영 즉시 압축 엔진 가동! 🕵️‍♀️💨
      const optimizedDataUrl = await compressImage(rawDataUrl);
      setImgSrc(optimizedDataUrl);
      setIsCapturing(false);
      processImage(optimizedDataUrl);
    }
  };

  const processImage = async (dataUrl: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, country: 'JP' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `서버 응답 에러: ${response.status}`);
      }

      const data = await response.json();
      const ocrResults = data.results || [];
      setResults(ocrResults);
      setImgDimensions({ width: data.imgWidth, height: data.imgHeight });
      
      const tempImg = new Image();
      tempImg.onload = () => {
        runColorExtraction(tempImg, ocrResults);
        setShowOverlays(true);
      };
      tempImg.src = dataUrl;
    } catch (err: any) {
      console.error("Scan failed:", err);
      // v300: 사용자에게 더 친절한 에러 메시지 노출 💖
      alert(`번역 중 에러가 발생했어요: ${err.message || "알 수 없는 에러"}\n이미지가 너무 크거나 서버 연결이 불안정할 수 있습니다.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // v272: 'Perfect Fit' object-contain scaling engine 🕵️‍♀️📏✨
  // 브라우저의 object-contain 알고리즘과 1:1로 일치하는 계산식을 사용하여 오차를 원천 차단합니다.
  const calculateOverlayRect = () => {
    if (!imgRef.current || !containerRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const nw = imgRef.current.naturalWidth || (imgDimensions?.width || 1000);
    const nh = imgRef.current.naturalHeight || (imgDimensions?.height || 1000);
    const cw = rect.width;
    const ch = rect.height;

    const scale = Math.min(cw / nw, ch / nh);
    const width = nw * scale;
    const height = nh * scale;
    const x = (cw - width) / 2;
    const y = (ch - height) / 2;

    const overlayLeft = (rect.left - containerRect.left) + x;
    const overlayTop = (rect.top - containerRect.top) + y;

    setOverlayStyle({
      position: 'absolute',
      width: `${width}px`,
      height: `${height}px`,
      top: `${overlayTop}px`,
      left: `${overlayLeft}px`,
      pointerEvents: 'none',
      zIndex: 20,
      renderedW: width,
      renderedH: height,
      overflow: 'visible' // v273: 하단 텍스트 누락 방지를 위한 안전장치 ✨
    });
    
    console.log(`v272 Sync: Box[${Math.round(width)}x${Math.round(height)}] @ (${Math.round(overlayLeft)}, ${Math.round(overlayTop)}) | Scale: ${scale.toFixed(4)}`);
  };

  // 이미지 컨테이너 크기가 바뀔 때마다(카트 패널 애니메이션 포함) 오버레이 재계산
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      calculateOverlayRect();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isCapturing, imgSrc]);

  useEffect(() => {
    if (!isCapturing && imgSrc) {
      window.addEventListener('resize', calculateOverlayRect);
      const timer = setTimeout(calculateOverlayRect, 150);
      return () => {
        window.removeEventListener('resize', calculateOverlayRect);
        clearTimeout(timer);
      };
    }
  }, [isCapturing, imgSrc]);

  const handleItemClick = (res: any) => {
    if (res.isPrice) return;
    const name = res.original || res.text || '';
    setSelectedItems(prev => {
      const exists = prev.findIndex(item => item.name === name);
      if (exists >= 0) {
        // 이미 담긴 항목이면 제거 (토글)
        return prev.filter((_, i) => i !== exists);
      }
      return [...prev, {
        name,
        translated: res.description || res.translated || name,
        prices: res.coupledPrices || [],
      }];
    });
    setShowCart(true);
  };

  const resetScanner = () => {
    setImgSrc(null);
    setResults([]);
    setImgDimensions(null);
    setColorMap({});
    setShowOverlays(false);
    setSelectedItems([]);
    setShowCart(false);
    setIsCapturing(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        // v300: 업로드한 파일도 압축 엔진 가동! 📂🕵️‍♀️💨
        const optimizedDataUrl = await compressImage(dataUrl);
        setImgSrc(optimizedDataUrl);
        setIsCapturing(false);
        processImage(optimizedDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-[110] pointer-events-none">
        <button 
          onClick={onClose}
          className="bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-black/60 p-2 flex items-center justify-center transition-all active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main View */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-neutral-900 overflow-hidden">
        <div 
          ref={containerRef}
          className="relative w-full max-w-[430px] h-[75vh] shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden bg-black [container-type:size]" 
          style={{ height: isCapturing ? '100%' : '75vh' }}
        >
          {isCapturing ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            imgSrc && (
              <img 
                ref={imgRef}
                src={imgSrc} 
                alt="Captured" 
                className="w-full h-full object-contain"
                onLoad={calculateOverlayRect}
              />
            )
          )}

          <AnimatePresence>
            {isFlashActive && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white z-[120]"
              />
            )}
          </AnimatePresence>

          {showOverlays && imgDimensions && overlayStyle.renderedW && (
            <div style={overlayStyle}>
              {(() => {
                // v285: 절대 픽셀 좌표 배율 계산 정밀성 향상 🎯 (소수점 6자리까지 확보)
                const sourceW = imgRef.current?.naturalWidth || imgDimensions.width;
                const sourceH = imgRef.current?.naturalHeight || imgDimensions.height;
                const scaleX = overlayStyle.renderedW! / sourceW;
                const scaleY = overlayStyle.renderedH! / sourceH;

                return results.map((res: any, i: number) => {
                  const [cx, cy, w, h] = res.bbox;
                  const itemName = res.original || res.text || '';
                  const isSelected = selectedItems.some(s => s.name === itemName);

                  return (
                    <TranslationItem
                      key={i}
                      id={i}
                      text={itemName}
                      cx={cx}
                      cy={cy}
                      w={w}
                      h={h}
                      scaleX={scaleX}
                      scaleY={scaleY}
                      angle={res.angle}
                      isVertical={res.isVertical}
                      isPrice={res.isPrice}
                      isSelected={isSelected}
                      onClick={!res.isPrice ? () => handleItemClick(res) : undefined}
                      fontSize={calculateFontSizeToFit(
                        res.translated || res.text || res.original,
                        w * scaleX,
                        h * scaleY,
                        res.isVertical,
                        { max: 56, min: 10, padding: 0.9 }
                      )}
                      textColor="#ffffff"
                      backgroundColor="transparent"
                      fontWeight="bold"
                      delay={i * 0.01 + 0.15}
                    />
                  );
                });
              })()}
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <RefreshCw className="w-12 h-12 text-cyan-400" />
              </motion.div>
              <p className="mt-4 text-white font-medium text-lg text-center px-4">AI가 예술적으로 번역 중이에요... 🎨✨</p>
            </div>
          )}
        </div>
      </div>

      {/* 담은 메뉴 리스트 패널 */}
      <AnimatePresence>
        {showCart && selectedItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="z-[110] bg-black/90 backdrop-blur-lg border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <span className="text-white text-sm font-bold">담은 메뉴 ({selectedItems.length})</span>
              <button
                onClick={() => { setSelectedItems([]); setShowCart(false); }}
                className="text-white/40 hover:text-white text-xs transition-colors"
              >
                전체 삭제
              </button>
            </div>
            <div className="px-4 pb-3 flex flex-col gap-2 max-h-40 overflow-y-auto">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{item.translated || item.name}</p>
                    {item.prices.length > 0 && (
                      <p className="text-yellow-300 text-xs mt-0.5">
                        {item.prices.map(p => p.value).join(' / ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedItems(prev => prev.filter((_, i) => i !== idx))}
                    className="ml-3 text-white/30 hover:text-white/80 text-sm transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Controls */}
      <div className="px-6 pb-14 z-[110] bg-black/80 backdrop-blur-lg flex flex-col items-center">
        
        {!isCapturing && !isProcessing && imgSrc && (
          <div className="mb-6 flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/10 w-full max-w-[280px]">
            <button 
              onClick={() => setShowOverlays(false)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${!showOverlays ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              원본보기
            </button>
            <button 
              onClick={() => setShowOverlays(true)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all ${showOverlays ? 'bg-cyan-500 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
            >
              번역보기
            </button>
          </div>
        )}

        <div className="w-full flex justify-between items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect} 
          />

          <button 
            onClick={isCapturing ? triggerFileSelect : resetScanner} 
            className="text-white/60 hover:text-white p-2 flex items-center justify-center transition-all active:scale-95"
          >
            {isCapturing ? (
              <ImageIcon className="w-7 h-7" />
            ) : (
              <RotateCw className="w-7 h-7" />
            )}
          </button>

          <div className="relative">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={captureImage}
              disabled={!isCapturing}
              className={`w-20 h-20 rounded-full flex items-center justify-center p-1 border-4 ${isCapturing ? 'border-white' : 'border-white/20'}`}
            >
              <div className={`w-full h-full rounded-full ${isCapturing ? 'bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'bg-white/20'}`} />
            </motion.button>
            
            {isCapturing && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full border-2 border-black"
              />
            )}
          </div>

          <button 
            className="text-white/60 hover:text-white p-2 flex items-center justify-center transition-all active:scale-95"
          >
            <Maximize2 className="w-7 h-7" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

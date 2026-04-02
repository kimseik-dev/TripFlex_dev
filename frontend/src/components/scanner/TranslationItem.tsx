import React from 'react';
import { motion } from 'framer-motion';
import { calculateFontSizeToFit } from '@/utils/scanner/layoutEngine';

/**
 * Scanner Translation Item ✨
 * v300: '박스 핏' 초정밀 리사이징 엔진 탑재! 📐🧼✨
 * 번역된 텍스트가 원본 박스 크기에 딱 맞게 자동 조절됩니다.
 */

interface TranslationItemProps {
  id: number;
  text: string;
  cx: number;    // 중심점 X (원본 픽셀)
  cy: number;    // 중심점 Y (원본 픽셀)
  w: number;     // 너비 (원본 픽셀)
  h: number;     // 높이 (원본 픽셀)
  scaleX: number; // 렌더링 배율 X
  scaleY: number; // 렌더링 배율 Y
  angle?: number;
  fontSize: string; // 기본 참조 폰트 크기
  fontWeight?: 'normal' | 'medium' | 'bold';
  textColor?: string;
  backgroundColor?: string;
  delay?: number;
  isVertical?: boolean; // v275: 세로쓰기 여부 추가 ✨
}

export const TranslationItem: React.FC<TranslationItemProps> = ({
  id,
  text,
  cx,
  cy,
  w,
  h,
  scaleX,
  scaleY,
  angle = 0,
  fontSize,
  fontWeight = 'bold',
  textColor = '#ffffff',
  backgroundColor = 'transparent', 
  delay = 0.2,
  isVertical = false
}) => {
  // 렌더링될 실제 픽셀 좌표 및 크기 계산 🎯
  const itemLeft = cx * scaleX;
  const itemTop = cy * scaleY;
  const itemWidth = w * scaleX;
  const itemHeight = h * scaleY;

  const safeText = text || '';
  
  // v300: 박스 크기와 텍스트 길이에 맞춰 폰트 크기를 완벽하게 가둡니다. 📏🧼✨
  const adjustedFontSize = calculateFontSizeToFit(
    safeText,
    itemWidth,
    itemHeight,
    isVertical,
    { max: parseFloat(fontSize) * 1.2, min: 8 }
  );

  return (
    <div 
      className="absolute pointer-events-none flex items-center justify-center"
      style={{ 
        left: `${itemLeft}px`, 
        top: `${itemTop}px`, 
        width: `${itemWidth}px`, 
        height: `${itemHeight}px`,
        backgroundColor: backgroundColor, 
        // v320: 수직축을 -52%로 미세 조정하여 폰트 하단 여백 편향 상쇄 🎯
        transform: `translate(-50%, -52%) rotate(${angle}deg)`, 
        zIndex: 50 + id,
        // 가로/세로 모두 박스 내에서 줄바꿈이 필요한 경우 허용 ↕️↔️
        whiteSpace: 'pre-wrap', 
        overflow: 'visible'
      }}
    >
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: delay, duration: 0.3 }}
        style={{ 
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center'
        }}
      >
        {/* v300: 가로/세로 모두 번역문을 표시하며, 박스 크기에 맞춰 폰트가 조절됩니다. ✨📸 */}
        <span 
          className={`whitespace-pre-wrap break-all tracking-tighter inline-block font-${fontWeight}`} 
          style={{ 
            fontSize: adjustedFontSize, 
            color: textColor,
            backgroundColor: 'rgba(0,0,0,0.85)', 
            padding: isVertical ? '3px 1px' : '1px 4px', 
            borderRadius: '2px',
            WebkitTextStroke: '0.1px rgba(255,255,255,0.1)', 
            textShadow: '0px 1px 2px rgba(0,0,0,0.95)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
            textAlign: 'center',
            writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: isVertical ? 'upright' : 'mixed',
            lineHeight: '1.1'
          } as React.CSSProperties}
        >
          {safeText}
        </span>
        
        {/* v300: 텍스트를 감싸는 프리미엄 '스캔 프레임 박스' (좌표 텍스트 대체) 🎨✨ */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.4 }}
          className="absolute inset-0 border border-white/20 pointer-events-none rounded-sm overflow-visible"
          style={{ 
            boxShadow: 'inset 0 0 10px rgba(0,255,255,0.05)',
            borderColor: isVertical ? 'rgba(0,255,255,0.3)' : 'rgba(255,255,255,0.15)'
          }}
        >
          {/* 네 모서리 L자형 강조 포인트 (Corner Accents) 📐✨ */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t-2 border-l-2 border-cyan-400/80 -translate-x-[1px] -translate-y-[1px]" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t-2 border-r-2 border-cyan-400/80 translate-x-[1px] -translate-y-[1px]" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b-2 border-l-2 border-cyan-400/80 -translate-x-[1px] translate-y-[1px]" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b-2 border-r-2 border-cyan-400/80 translate-x-[1px] translate-y-[1px]" />

          {/* 중앙 가이드 라인 (세로형인 경우에만 얇게 표시) ↕️ */}
          {isVertical && (
            <div className="absolute top-0 bottom-0 left-1/2 w-[0.5px] bg-cyan-400/20 -translate-x-1/2 dashed" />
          )}
          
          {/* 스캔 진행 중인 듯한 글로우 빔 (동적 애니메이션) 🌈 */}
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className={`absolute ${isVertical ? 'left-0 right-0 h-[1px] w-full' : 'top-0 bottom-0 w-[1px] h-full'} bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent`}
          />

          {/* v311: 초정밀 좌표 데이터 레이블 (X, Y | WxH) 🕵️‍♀️📐✨ */}
          <div 
            className="absolute -top-4 left-0 whitespace-nowrap bg-black/70 backdrop-blur-sm text-[7px] text-cyan-400 font-mono px-1 rounded-sm border-l border-cyan-400/50 flex items-center gap-1 shadow-lg pointer-events-none"
            style={{ 
              opacity: 0.9,
              letterSpacing: '-0.2px'
            }}
          >
            <span className="opacity-50 font-bold">POS</span>
            <span>{Math.round(cx)},{Math.round(cy)}</span>
            <span className="w-[1px] h-2 bg-white/10 mx-0.5" />
            <span className="opacity-50 font-bold">SIZE</span>
            <span>{Math.round(w)}×{Math.round(h)}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

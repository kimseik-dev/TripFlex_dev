import React from 'react';
import { motion } from 'framer-motion';
import { calculateFontSizeToFit } from '@/utils/scanner/layoutEngine';

/**
 * Scanner Translation Item ✨
 * v300: '박스 핏' 초정밀 리사이징 엔진 탑재! 📐🧼✨
 * v400: 대표님 요청으로 텍스트 및 좌표 숨김, 박스 프레임만 강조! 🕵️‍♀️💎
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
  cx,
  cy,
  w,
  h,
  scaleX,
  scaleY,
  angle = 0,
  delay = 0.2,
  isVertical = false
}) => {
  // 렌더링될 실제 픽셀 좌표 및 크기 계산 🎯
  const itemLeft = cx * scaleX;
  const itemTop = cy * scaleY;
  const itemWidth = w * scaleX;
  const itemHeight = h * scaleY;

  return (
    <div 
      className="absolute pointer-events-none flex items-center justify-center"
      style={{ 
        left: `${itemLeft}px`, 
        top: `${itemTop}px`, 
        width: `${itemWidth}px`, 
        height: `${itemHeight}px`,
        // v320: 수직축을 -52%로 미세 조정하여 폰트 하단 여백 편향 상쇄 🎯
        transform: `translate(-50%, -52%) rotate(${angle}deg)`, 
        zIndex: 50 + id,
        overflow: 'visible'
      }}
    >
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: delay, duration: 0.3 }}
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center'
        }}
      >
        {/* v400: 텍스트는 숨기고 박스 프레임만 보여줍니다. (대표님 요청) 🕵️‍♀️✨ */}
        
        {/* v300: 프리미엄 '스캔 프레임 박스' 🎨✨ */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.4 }}
          className="absolute inset-0 border border-white/20 pointer-events-none rounded-sm overflow-visible"
          style={{ 
            boxShadow: 'inset 0 0 10px rgba(0,255,255,0.05)',
            borderColor: isVertical ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.25)'
          }}
        >
          {/* v520: 대표님 요청으로 좌표값을 박스 내부 정중앙으로 이동! 📐✨ */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.4)', 
              backdropFilter: 'blur(2px)',
            }}
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-cyan-400/30">
              <span className="text-[9px] font-mono font-bold text-cyan-300 drop-shadow-md">
                {Math.round(cx)}, {Math.round(cy)}
              </span>
            </div>
          </div>

          {/* 네 모서리 L자형 강조 포인트 (Corner Accents) 📐✨ */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-[3px] border-l-[3px] border-cyan-600 -translate-x-[1.5px] -translate-y-[1.5px]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-[3px] border-r-[3px] border-cyan-600 translate-x-[1.5px] -translate-y-[1.5px]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[3px] border-l-[3px] border-cyan-600 -translate-x-[1.5px] translate-y-[1.5px]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[3px] border-r-[3px] border-cyan-600 translate-x-[1.5px] translate-y-[1.5px]" />

          {/* 스캔 진행 중인 듯한 글로우 빔 (동적 애니메이션) 🌈 */}
          <motion.div 
            animate={{ 
              top: isVertical ? '0%' : ['0%', '100%', '0%'],
              left: isVertical ? ['0%', '100%', '0%'] : '0%'
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className={`absolute ${isVertical ? 'top-0 bottom-0 w-[1px]' : 'left-0 right-0 h-[1px]'} bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent`}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

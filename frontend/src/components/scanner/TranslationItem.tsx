import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scanner Translation Item ✨
 * v300: '박스 핏' 초정밀 리사이징 엔진 탑재! 📐🧼✨
 * v400: 대표님 요청으로 텍스트 및 좌표 숨김, 박스 프레임만 강조! 🕵️‍♀️💎
 * v600: 메뉴-가격 커플링 클릭 인터랙션 추가
 */

interface TranslationItemProps {
  id: number;
  text: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  scaleX: number;
  scaleY: number;
  angle?: number;
  fontSize: string;
  fontWeight?: 'normal' | 'medium' | 'bold';
  textColor?: string;
  backgroundColor?: string;
  delay?: number;
  isVertical?: boolean;
  isPrice?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
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
  isVertical = false,
  isPrice = false,
  isSelected = false,
  onClick,
}) => {
  const itemLeft = cx * scaleX;
  const itemTop = cy * scaleY;
  const itemWidth = w * scaleX;
  const itemHeight = h * scaleY;

  const isClickable = !!onClick && !isPrice;

  const borderColor = isSelected
    ? 'rgba(0,255,180,0.9)'
    : isPrice
    ? 'rgba(255,220,0,0.5)'
    : isVertical
    ? 'rgba(0,255,255,0.4)'
    : 'rgba(255,255,255,0.25)';

  return (
    <div
      className="absolute flex items-center justify-center"
      style={{
        left: `${itemLeft}px`,
        top: `${itemTop}px`,
        width: `${itemWidth}px`,
        height: `${itemHeight}px`,
        transform: `translate(-50%, -52%) rotate(${angle}deg)`,
        zIndex: 50 + id,
        overflow: 'visible',
        pointerEvents: isClickable ? 'auto' : 'none',
        cursor: isClickable ? 'pointer' : 'default',
      }}
      onClick={isClickable ? onClick : undefined}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay, duration: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: isSelected ? 1.04 : 1 }}
          transition={{ delay: delay + 0.1, duration: 0.4 }}
          className="absolute inset-0 rounded-sm overflow-visible"
          style={{
            border: `1px solid ${borderColor}`,
            boxShadow: isSelected
              ? 'inset 0 0 12px rgba(0,255,180,0.2), 0 0 8px rgba(0,255,180,0.3)'
              : isPrice
              ? 'inset 0 0 8px rgba(255,220,0,0.08)'
              : 'inset 0 0 10px rgba(0,255,255,0.05)',
          }}
        >
          {/* 중앙 정보 표시 */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              backgroundColor: isSelected ? 'rgba(0,255,180,0.15)' : 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {isSelected ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-500/30 border border-emerald-400/50">
                <span className="text-[9px] font-mono font-bold text-emerald-300">✓ 담음</span>
              </div>
            ) : isPrice ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm border border-yellow-400/30">
                <span className="text-[9px] font-mono font-bold text-yellow-300">₩</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-cyan-400/30">
                <span className="text-[9px] font-mono font-bold text-cyan-300 drop-shadow-md">
                  {Math.round(cx)}, {Math.round(cy)}
                </span>
              </div>
            )}
          </div>

          {/* 네 모서리 강조 */}
          <div className={`absolute top-0 left-0 w-2 h-2 border-t-[3px] border-l-[3px] -translate-x-[1.5px] -translate-y-[1.5px] ${isSelected ? 'border-emerald-400' : isPrice ? 'border-yellow-500' : 'border-cyan-600'}`} />
          <div className={`absolute top-0 right-0 w-2 h-2 border-t-[3px] border-r-[3px] translate-x-[1.5px] -translate-y-[1.5px] ${isSelected ? 'border-emerald-400' : isPrice ? 'border-yellow-500' : 'border-cyan-600'}`} />
          <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-[3px] border-l-[3px] -translate-x-[1.5px] translate-y-[1.5px] ${isSelected ? 'border-emerald-400' : isPrice ? 'border-yellow-500' : 'border-cyan-600'}`} />
          <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-[3px] border-r-[3px] translate-x-[1.5px] translate-y-[1.5px] ${isSelected ? 'border-emerald-400' : isPrice ? 'border-yellow-500' : 'border-cyan-600'}`} />

          {/* 스캔 글로우 빔 */}
          <motion.div
            animate={{
              top: isVertical ? '0%' : ['0%', '100%', '0%'],
              left: isVertical ? ['0%', '100%', '0%'] : '0%',
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className={`absolute ${isVertical ? 'top-0 bottom-0 w-[1px]' : 'left-0 right-0 h-[1px]'} bg-gradient-to-r from-transparent ${isSelected ? 'via-emerald-400/50' : isPrice ? 'via-yellow-400/50' : 'via-cyan-400/50'} to-transparent`}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

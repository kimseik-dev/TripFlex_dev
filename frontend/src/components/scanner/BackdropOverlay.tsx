import React from 'react';
import { motion } from 'framer-motion';

/**
 * Scanner Backdrop Overlay ✨
 * 원본 이미지를 차분하게 눌러주는 프리미엄 다크 필터! 🕵️‍♀️☁️
 */

interface BackdropOverlayProps {
  isVisible: boolean;
  opacity?: number;
  blur?: string;
}

export const BackdropOverlay: React.FC<BackdropOverlayProps> = ({ 
  isVisible, 
  opacity = 0.7, 
  blur = '2px' 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ 
        backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        backdropFilter: `blur(${blur})`,
        WebkitBackdropFilter: `blur(${blur})` // Safari 호환성
      }}
      className="absolute inset-0 z-10 pointer-events-none"
    />
  );
};

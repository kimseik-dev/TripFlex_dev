/**
 * Scanner Layout Engine 📐✨
 * v116: 지능형 충돌 방지 및 가독성 최적화 로직! 🕵️‍♀️📏
 * 빽빽한 메뉴판에서 번역문이 겹치지 않게 조율합니다.✨🧱
 */

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 번역 박스들이 서로 겹치지 않게 수직 위치를 지능적으로 조정합니다. 📐📍
 */
export const calculatePushedTop = (
  currentTop: number,
  currentLeft: number,
  currentWidth: number,
  currentHeight: number,
  existingBoxes: Box[]
): number => {
  let finalTop = currentTop;
  const padding = 1.2; // v117: 줄 간격 빽빽한 경우를 고려해 안전 거리 확보 📐✨

  // v116: 위에서 아래로 정렬된 기존 박스들과 비교하여 겹치는지 체크 🧱
  const overlappingBoxes = existingBoxes.filter(box => {
    const horizontalOverlap = 
      currentLeft < box.x + box.w && currentLeft + currentWidth > box.x;
    const verticalOverlap = 
      finalTop < box.y + box.h && finalTop + currentHeight > box.y;
    return horizontalOverlap && verticalOverlap;
  });

  // 겹치는 박스가 있다면 가장 아래에 있는 박스 바로 밑으로 밀어냅니다. 🎬
  if (overlappingBoxes.length > 0) {
    const bottoms = overlappingBoxes.map(b => b.y + b.h);
    finalTop = Math.max(...bottoms) + padding;
  }

  return finalTop;
};

/**
 * 원본 상자 높이에 비례한 폰트 크기를 계산합니다. (v200: 픽셀 기반 최적화) 📏👑
 */
export const getProportionalFontSize = (
  renderedHeight: number,
  options: { scale?: number; max?: number; min?: number } = {}
): string => {
  const { scale = 0.75, max = 40, min = 10 } = options;
  // renderedHeight는 이미 화면에 그려진 픽셀 높이입니다.
  const size = Math.min(max, Math.max(min, renderedHeight * scale));
  return `${size}px`;
};

/**
 * 텍스트 박스 크기에 딱 맞는 최적의 폰트 크기를 계산합니다. 📐📏✨
 * (v300: 수학적 비례 기반 Auto-Fitting Engine)
 */
export const calculateFontSizeToFit = (
  text: string,
  boxWidth: number,
  boxHeight: number,
  isVertical: boolean,
  options: { max?: number; min?: number; padding?: number } = {}
): string => {
  const { max = 64, min = 8, padding = 0.85 } = options;
  const len = Math.max(1, text.length);

  let optimalSize: number;

  if (isVertical) {
    // 세로형: 너비(itemWidth)가 폰트 크기, 높이(itemHeight)가 전체 길이를 결정! ↕️
    const fontSizeByWidth = boxWidth * padding;
    const fontSizeByHeight = (boxHeight * padding) / (len * 1.05); // 줄 간격 마진 고려 📏
    optimalSize = Math.min(fontSizeByWidth, fontSizeByHeight);
  } else {
    // 가로형: 높이(itemHeight)가 폰트 크기, 너비(itemWidth)가 전체 길이를 결정! ↔️
    const fontSizeByHeight = boxHeight * padding;
    const fontSizeByWidth = (boxWidth * padding) / (len * 0.9); // 한글/일어 가로폭 보정 🕵️‍♀️
    optimalSize = Math.min(fontSizeByHeight, fontSizeByWidth);
  }

  const finalSize = Math.min(max, Math.max(min, optimalSize));
  return `${finalSize}px`;
};

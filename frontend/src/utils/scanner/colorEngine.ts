/**
 * Scanner Color Engine 🎨✨
 * v115: 중간값(Median) 기반 프리미엄 배경 추출 엔진! 🕵️‍♀️🖌️
 * 주변 텍스트(노이즈)를 지능적으로 걸러내고 순수 배경색만 찾아냅니다. ✨🧼
 */

export interface ColorResult {
  bg: string;
  text: string;
}

/**
 * 픽셀 값들의 중간값(Median)을 구합니다. 📊
 */
const getMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
};

/**
 * 캔버스의 특정 영역에서 배경색과 글자색을 지능적으로 샘플링합니다. 🧠✨
 */
export const extractDominantColors = (
  canvas: HTMLCanvasElement,
  box: [number, number, number, number] // [x, y, w, h] in %
): ColorResult => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { bg: '#000000', text: '#ffffff' };

  const x = Math.max(0, (box[0] * canvas.width) / 100);
  const y = Math.max(0, (box[1] * canvas.height) / 100);
  const w = Math.min(canvas.width - x, (box[2] * canvas.width) / 100);
  const h = Math.min(canvas.height - y, (box[3] * canvas.height) / 100);

  // v115: 배경색 샘플링 지점 대폭 확대 (박스 외부 및 경계면 12개 지점) 🎨📍
  const offset = 3;
  const samplePoints = [
    [x - offset, y - offset], [x + w / 2, y - offset], [x + w + offset, y - offset],
    [x - offset, y + h / 2], [x + w + offset, y + h / 2],
    [x - offset, y + h + offset], [x + w / 2, y + h + offset], [x + w + offset, y + h + offset],
    [x + 1, y + 1], [x + w - 1, y + 1], [x + 1, y + h - 1], [x + w - 1, y + h - 1] // 내부 모서리 추가
  ];

  const rValues: number[] = [];
  const gValues: number[] = [];
  const bValues: number[] = [];

  samplePoints.forEach(([px, py]) => {
    const safeX = Math.max(0, Math.min(canvas.width - 1, px));
    const safeY = Math.max(0, Math.min(canvas.height - 1, py));
    const data = ctx.getImageData(safeX, safeY, 1, 1).data;
    rValues.push(data[0]);
    gValues.push(data[1]);
    bValues.push(data[2]);
  });

  // v115: 평균 대신 중간값(Median)을 사용하여 텍스트 픽셀(노이즈) 제거 🧼✨
  const finalBgR = getMedian(rValues);
  const finalBgG = getMedian(gValues);
  const finalBgB = getMedian(bValues);
  const bgColor = `rgb(${finalBgR}, ${finalBgG}, ${finalBgB})`;

  // v115: 글자색 추출 (중앙 샘플링 유지하되 대비 계산 강화) 🖋️
  let txR = 0, txG = 0, txB = 0, txCount = 0;
  const centerX = x + w / 2;
  const centerY = y + h / 2;
  
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const px = Math.floor(centerX + dx);
      const py = Math.floor(centerY + dy);
      if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
        const data = ctx.getImageData(px, py, 1, 1).data;
        txR += data[0]; txG += data[1]; txB += data[2];
        txCount++;
      }
    }
  }

  const avgTxR = txCount > 0 ? Math.floor(txR / txCount) : 255;
  const avgTxG = txCount > 0 ? Math.floor(txG / txCount) : 255;
  const avgTxB = txCount > 0 ? Math.floor(txB / txCount) : 255;

  const bgBrightness = (finalBgR * 299 + finalBgG * 587 + finalBgB * 114) / 1000;
  const txBrightness = (avgTxR * 299 + avgTxG * 587 + avgTxB * 114) / 1000;
  
  let finalTextColor = `rgb(${avgTxR}, ${avgTxG}, ${avgTxB})`;
  
  // v115: 대비 임계값을 높여서 시인성 확보 (기존 50 -> 70) 🔦
  if (Math.abs(bgBrightness - txBrightness) < 70) {
    finalTextColor = bgBrightness > 128 ? '#000000' : '#ffffff';
  }

  return { bg: bgColor, text: finalTextColor };
};

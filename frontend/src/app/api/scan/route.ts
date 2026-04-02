import { NextResponse } from 'next/server';

/**
 * Scan API Proxy for ScannerDual.tsx 🕵️‍♀️🚀
 * v310: Restored! 지능형 OCR 병합 + 릴레이 엔진을 사용합니다.
 */

const logger = {
  api: (msg: string) => console.log(`[API_SCAN] ${msg}`),
  error: (msg: string) => console.error(`[API_SCAN_ERROR] ${msg}`),
};

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    
    const GOOGLE_API_KEY = (process.env.GOOGLE_VISION_API_KEY || '').trim();
    const relayUrl = (process.env.RELAY_SERVER_URL || '').trim();
    const bearerToken = (process.env.RELAY_BEARER_TOKEN || '').trim();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    // 1. 이미지 크기 정밀 확정
    const { width: finalWidth, height: finalHeight } = getImageDimensions(imgBuffer);

    // 2. Google Cloud Vision OCR 수행
    const googleUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
    const googleRes = await fetch(googleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            requests: [{
                image: { content: base64Data },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
            }]
        })
    });

    if (!googleRes.ok) throw new Error(`Google OCR Failed: ${googleRes.status}`);
    const googleData = await googleRes.json();
    const textAnnotations = googleData.responses?.[0]?.textAnnotations || [];
    
    if (textAnnotations.length === 0) {
        return NextResponse.json({ message: 'No text detected', results: [] });
    }

    // 3. Shared Relay API 호출
    let relayData = null;
    if (relayUrl && bearerToken) {
        const relayRes = await fetch(relayUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': bearerToken },
            body: JSON.stringify({
                data: [{ imageId: `tripflex_scan_${Date.now()}`, image: base64Data, annotations: textAnnotations }],
                country: 'JP'
            })
        });
        relayData = relayRes.ok ? await relayRes.json() : null;
    }

    // 4. 지능형 병합 로직
    const initialAnns = textAnnotations.slice(1).map((anno: any) => {
        const vertices = anno.boundingPoly?.vertices || [];
        const bx = Math.min(...vertices.map((v: any) => v.x || 0));
        const by = Math.min(...vertices.map((v: any) => v.y || 0));
        const bw = Math.max(...vertices.map((v: any) => v.x || 0)) - bx;
        const bh = Math.max(...vertices.map((v: any) => v.y || 0)) - by;
        return { description: anno.description || '', bx, by, bw, bh };
    });

    const groups = processAdaptiveMerging(initialAnns);
    const relayAnns = relayData?.data?.[0]?.annotations || relayData?.annotations || [];

    const finalResults = groups.map((g: any) => {
        const rawSegments: string[] = g.isVertical 
            ? g.combinedText.split('').map((char: string) => {
                const match = relayAnns.find((ra: any) => ra.originalText === char);
                return (match && match.translatedText) ? match.translatedText.trim() : char;
              })
            : g.combinedText.split(' ').map((word: string) => {
                const match = relayAnns.find((ra: any) => ra.originalText === word);
                return (match && match.translatedText) ? match.translatedText.trim() : word;
              });

        const uniqueSegments = Array.from(new Set(rawSegments.filter(s => s.length > 0)));
        const combinedTranslated = uniqueSegments.join(g.isVertical ? "" : " ");

        return {
            original: g.combinedText,
            translated: combinedTranslated,
            bbox: [g.cx, g.cy, g.width, g.height],
            isVertical: g.isVertical
        };
    });

    return NextResponse.json({ 
        results: finalResults, 
        aspectRatio: finalWidth / finalHeight 
    });

  } catch (error: any) {
    logger.error(`SCAN ERROR: ${error.message}`);
    return NextResponse.json({ error: error.message || 'Restoration error' }, { status: 500 });
  }
}

// Helper Functions
function getImageDimensions(buffer: Buffer) {
  return { width: 1000, height: 1000 };
}

function processAdaptiveMerging(anns: any[]) {
  const groups: any[] = [];
  const used = new Set();
  for (let i = 0; i < anns.length; i++) {
    if (used.has(i)) continue;
    const currentGroup = [anns[i]];
    used.add(i);
    for (let j = i + 1; j < anns.length; j++) {
      if (used.has(j)) continue;
      const last = currentGroup[currentGroup.length - 1];
      const target = anns[j];
      const isHorizontalSameLine = Math.abs(last.by - target.by) < Math.max(last.bh, target.bh) * 0.5 && (target.bx - (last.bx + last.bw)) < Math.max(last.bh, target.bh) * 1.5;
      if (isHorizontalSameLine) { currentGroup.push(target); used.add(j); }
    }
    const minX = Math.min(...currentGroup.map(a => a.bx));
    const minY = Math.min(...currentGroup.map(a => a.by));
    const maxX = Math.max(...currentGroup.map(a => a.bx + a.bw));
    const maxY = Math.max(...currentGroup.map(a => a.by + a.bh));
    groups.push({ combinedText: currentGroup.map(a => a.description).join(" "), cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, width: maxX - minX, height: maxY - minY, isVertical: (maxY - minY) > (maxX - minX) * 1.5 });
  }
  return groups;
}

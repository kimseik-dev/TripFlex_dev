import { NextResponse } from 'next/server';

/**
 * TripFlex Adaptive Hybrid Router (v310 Restored! 🕵️‍♀️🦾)
 * 🏮 지능형 OCR 병합 + 릴레이 엔진 정밀 복구 완료! ✨🌈
 */

const logger = {
  api: (msg: string) => console.log(`[API_RELAY] ${msg}`),
  error: (msg: string) => console.error(`[API_RELAY_ERROR] ${msg}`),
};

export async function POST(req: Request) {
  try {
    const { image, country = 'JP' } = await req.json();
    
    // v310: .env에서 소중한 열쇠(API 키)들을 읽어옵니다. 🔑✨
    const GOOGLE_API_KEY = (process.env.GOOGLE_VISION_API_KEY || '').trim();
    const relayUrl = (process.env.RELAY_SERVER_URL || '').trim();
    const bearerToken = (process.env.RELAY_BEARER_TOKEN || '').trim();

    // v310: 구글 형님의 API 키가 서버에서 잘 읽히고 있는지 첫 5글자만 확인해볼까요? 🕵️‍♀️✨
    logger.api(`API KEY 로드 확인: ${GOOGLE_API_KEY ? GOOGLE_API_KEY.slice(0, 5) + '*****' : '❌ 비어있음'}`);

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const approxSize = image ? Math.round((image.length * 3) / 4 / 1024) : 0;
    logger.api(`Adaptive Hybrid Router 요청 수신됨! (Size: ${approxSize}KB) 🚢`);

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.includes('your-')) {
        throw new Error('Google Vision API Key is missing or invalid in .env 🔐');
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    // 1. 이미지 크기 정밀 확정 📐
    const { width: finalWidth, height: finalHeight } = getImageDimensions(imgBuffer);
    logger.api(`좌표 기준 크기 정밀 확정 (v275 Adaptive System): ${finalWidth}x${finalHeight} 📐✨`);

    // 2. Google Cloud Vision OCR 수행 👁️✨
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

    if (!googleRes.ok) {
        const errorJson = await googleRes.json();
        logger.error(`GOOGLE API FULL ERROR: ${JSON.stringify(errorJson, null, 2)}`);
        throw new Error(`Google OCR Failed: ${googleRes.status}`);
    }
    const googleData = await googleRes.json();
    const textAnnotations = googleData.responses?.[0]?.textAnnotations || [];
    
    if (textAnnotations.length === 0) {
        return NextResponse.json({ message: 'No text detected', results: [] });
    }

    // 3. Shared Relay API 호출 (선택 사항 - 실패해도 흐름 유지) 📤📦
    let relayData = null;
    if (relayUrl && bearerToken && !relayUrl.includes('your-')) {
        try {
            const relayRes = await fetch(relayUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': bearerToken },
                body: JSON.stringify({
                    data: [{ imageId: `tripflex_${Date.now()}`, image: base64Data, annotations: textAnnotations }],
                    country: country
                }),
                signal: AbortSignal.timeout(5000) // 5초 타임아웃 추가 ⏱️
            });
            if (relayRes.ok) {
                relayData = await relayRes.json();
                logger.api("Relay Server 전송 성공! ✅");
            } else {
                logger.error(`Relay Server 응답 에러: ${relayRes.status}`);
            }
        } catch (err: any) {
            logger.error(`Relay Server 연결 실패 (선택 사항 우회): ${err.message}`);
        }
    }

    // 4. 지능형 적응형 병합 엔진 가동 (v311: Y축 정렬 및 세로 병합 임계값 강화! 🕵️‍♀️📐)
    const initialAnns = textAnnotations.slice(1).map((anno: any) => {
        const vertices = anno.boundingPoly?.vertices || [];
        const bx = Math.min(...vertices.map((v: any) => v.x || 0));
        const by = Math.min(...vertices.map((v: any) => v.y || 0));
        const bw = Math.max(...vertices.map((v: any) => v.x || 0)) - bx;
        const bh = Math.max(...vertices.map((v: any) => v.y || 0)) - by;
        return { description: anno.description || '', bx, by, bw, bh };
    });

    const groups = processAdaptiveMerging(initialAnns);
    const rates = await getKRWRates();
    const relayAnns = relayData?.data?.[0]?.annotations || relayData?.annotations || [];

    // 5. 번역 및 결과 매핑 🛣️🕵️‍♀️
    const finalResults = groups.map((g: any) => {
        const rawSegments = g.combinedText.split(g.isVertical ? "" : " ");
        
        const translatedSegments = rawSegments.map((seg: string) => {
            const match = relayAnns.find((ra: any) => ra.originalText === seg);
            return (match && match.translatedText) ? match.translatedText.trim() : seg;
        });

        // v315: 중복 제거 및 요약 로직 전면 제거! (각각의 위치에 각각의 텍스트를 1:1로 매칭합니다) 🎯✨
        let finalTranslated = translatedSegments.join(g.isVertical ? "" : " ");
        finalTranslated = fixMenuTranslation(finalTranslated);
        
        const krwPrice = convertPriceToKRW(g.combinedText, rates);
        if (krwPrice) {
            finalTranslated = `${finalTranslated} (약 ${krwPrice}원)`;
        }

        return {
            original: g.combinedText,
            translated: finalTranslated,
            bbox: [g.cx, g.cy, g.width, g.height],
            laneIdx: 0,
            angle: 0,
            isVertical: g.isVertical
        };
    });

    return NextResponse.json({ 
        results: finalResults, 
        imgWidth: finalWidth, 
        imgHeight: finalHeight, 
        aspectRatio: finalWidth / finalHeight 
    });

  } catch (error: any) {
    logger.error(`RELAY ERROR: ${error.message}`);
    return NextResponse.json({ error: error.message || 'Restoration logic error' }, { status: 500 });
  }
}

// --- 🛠️ 헬퍼 함수들 (Restored!) --- 🕵️‍♀️✨🌈

function getImageDimensions(buffer: Buffer) {
  const HEADER_DATA = buffer.slice(0, 100);
  if (HEADER_DATA.toString('ascii', 6, 10) === 'JFIF') {
    let i = 2;
    while (i < buffer.length) {
      if (buffer[i] === 0xff && (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)) {
        return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
      }
      i += 2 + buffer.readUInt16BE(i + 2);
    }
  }
  return { width: 1000, height: 1000 };
}

function processAdaptiveMerging(anns: any[]) {
  // v370: Script-Aware Helper Functions 🕵️‍♀️🔍
  const isCJK = (text: string) => /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\ud840-\ud87f\uac00-\ud7af]/.test(text);
  const isNumericOnly = (text: string) => /^[\d\s\(\)\$€￥\.\-,]+$/.test(text);

  // v330: '고밀도 세로 기둥 사전 감지(Global Vertical Pillar Detection)' 🕵️‍♀️🦒✨
  const xDensity = new Array(101).fill(0);
  anns.forEach(ann => {
    const xBin = Math.floor((ann.bx + ann.bw / 2) / 10); 
    // v370: 숫자/기호만 있는 조각은 기둥 밀도 기여도를 0.2로 낮춤 (허수 기둥 방지!) 🚫🦒
    const weight = isNumericOnly(ann.description) ? 0.2 : 1.0;
    if (xBin >= 0 && xBin <= 100) xDensity[xBin] += weight;
  });
  
  const avgDensity = anns.length / 100;
  const pillarZones = xDensity
    .map((count, bin) => count > Math.max(2, avgDensity * 1.6) ? bin * 10 : -1)
    .filter(val => val !== -1);

  let remaining = [...anns].sort((a, b) => (a.by + a.bh / 2) - (b.by + b.bh / 2));
  const groups: any[] = [];

  while (remaining.length > 0) {
    const ref = remaining[0];
    const refCenterX = ref.bx + ref.bw / 2;
    const refCenterY = ref.by + ref.bh / 2;
    const refIsCJK = isCJK(ref.description);
    const refIsNumeric = isNumericOnly(ref.description);
    
    const isInsidePillar = pillarZones.some(zoneX => Math.abs(refCenterX - zoneX) < 15);
    
    let isPreferVertical = false;
    const candidates = remaining.filter(ann => ann !== ref);
    
    if (candidates.length > 0) {
      const nearest = candidates.map(ann => {
        let dx = Math.max(0, ann.bx - (ref.bx + ref.bw), ref.bx - (ann.bx + ann.bw));
        const dy = Math.max(0, ann.by - (ref.by + ref.bh), ref.by - (ann.by + ann.bh));
        const xOverlap = Math.min(ann.bx + ann.bw, ref.bx + ref.bw) - Math.max(ann.bx, ref.bx);
        const yOverlap = Math.min(ann.by + ann.bh, ref.by + ref.bh) - Math.max(ann.by, ref.by);
        
        // v370/v375: '가로 중력(Horizontal Gravity)' & '세로 저항(Vertical Resistance)' 🧲↔️🚫↕️
        // CJK 텍스트거나 숫자 조각인 경우 가로 거리를 0.5배로 낮게, 세로 거리는 2.5배로 멀게 느껴지게 함!
        let dy_eff = dy;
        if (refIsCJK || refIsNumeric || isCJK(ann.description)) {
            dx *= 0.5;
            dy_eff *= 2.5; 
        }

        return { ann, dx, dy: dy_eff, xOverlap, yOverlap, dist: Math.sqrt(dx*dx + dy_eff*dy_eff) };
      }).sort((a, b) => a.dist - b.dist)[0];

      if (nearest.yOverlap > nearest.ann.bh * 0.3 && nearest.dx < nearest.dy * 1.8) {
        isPreferVertical = false;
      } else if (nearest.xOverlap > nearest.ann.bw * 0.3 && nearest.dy < nearest.dx * 1.1) {
        isPreferVertical = true;
      } else {
        isPreferVertical = ref.bh > ref.bw * 1.5;
      }

      // v330/v360/v375: 기둥 구역 강제 모드 정밀화 - 숫자는 정밀 정렬된 기둥이 아니면 절대 세로로 묶지 않음.
      if (isInsidePillar && nearest.dx > ref.bw * 0.4 && ref.bw < ref.bh * 1.8 && !refIsNumeric) {
        isPreferVertical = true;
      }
    } else {
      isPreferVertical = (ref.bh > ref.bw * 1.5) || (isInsidePillar && ref.bw < ref.bh * 1.4 && !refIsNumeric);
    }

    let rowIndices: number[] = [];
    
    if (isPreferVertical) {
      // 2-A. 세로 버킷(Column Bucket) 생성 ↕️🧺
      rowIndices = remaining
        .map((ann, idx) => ({ 
          idx, 
          distX: Math.abs((ann.bx + ann.bw / 2) - refCenterX),
          overlapX: Math.min(ann.bx + ann.bw, ref.bx + ref.bw) - Math.max(ann.bx, ref.bx)
        }))
        .filter(item => item.distX < ref.bw * 0.7 || item.overlapX > Math.min(remaining[item.idx].bw, ref.bw) * 0.5)
        .map(item => item.idx);
    } else {
      // 2-B. 가로 버킷(Row Bucket) 생성 ↔️🧺
      rowIndices = remaining
        .map((ann, idx) => ({ 
          idx, 
          distY: Math.abs((ann.by + ann.bh / 2) - refCenterY),
          overlapY: Math.min(ann.by + ann.bh, ref.by + ref.bh) - Math.max(ann.by, ref.by)
        }))
        .filter(item => item.distY < ref.bh * 0.7 || item.overlapY > Math.min(remaining[item.idx].bh, ref.bh) * 0.5)
        .map(item => item.idx);
    }

    const currentBucket = rowIndices.map(idx => remaining[idx]);
    
    // 3. 버킷 내 정렬: 세로 모드는 Y축 순, 가로 모드는 X축 순으로! 🧭✅
    if (isPreferVertical) {
      currentBucket.sort((a, b) => a.by - b.by);
    } else {
      currentBucket.sort((a, b) => a.bx - b.bx);
    }

    // 4. 버킷 사용 처리 🧹
    remaining = remaining.filter((_, idx) => !rowIndices.includes(idx));

    // 5. 버킷 내 '가로/세로 병합' 수행 (v320: 방향에 따른 지능형 갭 체크) 🧩
    let currentGroup: any[] = [];
    for (const ann of currentBucket) {
      if (currentGroup.length === 0) {
        currentGroup = [ann];
      } else {
        const last = currentGroup[currentGroup.length - 1];
        let gap = 0;
        let threshold = 0;
        
        if (isPreferVertical) {
          gap = ann.by - (last.by + last.bh);
          // v340: 세로 메뉴는 이름과 가격 사이의 점선(....) 때문에 갭을 아주 넉넉하게(높이의 6.5배) 줍니다! ↕️🎯
          threshold = Math.max(last.bh, ann.bh) * 6.5; 
        } else {
          gap = ann.bx - (last.bx + last.bw);
          // v340: 가로 메뉴/그리드형 메뉴의 넓은 공백을 넘어가기 위해 갭 임계값을 4.5배로 넓힙니다! ↔️🧩
          threshold = Math.max(last.bh, ann.bh) * 4.5;
        }

        if (gap < threshold) {
          currentGroup.push(ann);
        } else {
          pushGroup(currentGroup, isPreferVertical);
          currentGroup = [ann];
        }
      }
    }
    if (currentGroup.length > 0) pushGroup(currentGroup, isPreferVertical);
  }

  function pushGroup(items: any[], forceVertical: boolean) {
    const combinedText = items.map(a => a.description).join(forceVertical ? "" : " ");
    const minX = Math.min(...items.map(a => a.bx));
    const minY = Math.min(...items.map(a => a.by));
    const maxX = Math.max(...items.map(a => a.bx + a.bw));
    const maxY = Math.max(...items.map(a => a.by + a.bh));
    
    groups.push({
      combinedText,
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
      // 개별 구성 성분이 세로였거나, 그룹 전체 모양이 세로라면 최종 세로 판정! ↕️✨
      isVertical: forceVertical || (maxY - minY) > (maxX - minX) * 1.5
    });
  }

  return groups;
}

async function getKRWRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/JPY');
    const data = await res.json();
    return data.rates?.KRW || 900;
  } catch {
    return 900;
  }
}

function convertPriceToKRW(text: string, rate: number) {
  const priceMatch = text.replace(/,/g, '').match(/(\d+)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    if (price > 10) return Math.round(price * rate / 100) * 100;
  }
  return null;
}

function fixMenuTranslation(text: string) {
  return text.replace(/커피/g, '☕ 커피').replace(/라떼/g, '🥛 라떼');
}

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
  const startTime = Date.now();
  try {
    const { image, country = 'JP' } = await req.json();
    
    const GOOGLE_API_KEY = (process.env.GOOGLE_VISION_API_KEY || '').trim();
    const relayUrl = (process.env.RELAY_SERVER_URL || '').trim();
    const bearerToken = (process.env.RELAY_BEARER_TOKEN || '').trim();

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

    const { width: finalWidth, height: finalHeight } = getImageDimensions(imgBuffer);
    logger.api(`좌표 기준 크기 정밀 확정 (v275 Adaptive System): ${finalWidth}x${finalHeight} 📐✨`);

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
                signal: AbortSignal.timeout(5000)
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

    const finalResults = groups.map((g: any) => {
        const rawSegments = g.combinedText.split(g.isVertical ? "" : " ");
        
        const translatedSegments = rawSegments.map((seg: string) => {
            const match = relayAnns.find((ra: any) => ra.originalText === seg);
            return (match && match.translatedText) ? match.translatedText.trim() : seg;
        });

        let finalTranslated = translatedSegments.join(g.isVertical ? "" : " ");
        finalTranslated = fixMenuTranslation(finalTranslated);
        
        const krwPrice = convertPriceToKRW(g.combinedText, rates);
        // v500: 업체의 'postPrice' 설명 "가격에 해당하는 텍스트에 대한 후처리 결과 (가격이 아닌 경우 ""으로 표시됨)"에 맞춰,
        // 단순하게 숫자만 포함된 문자열로 다듬습니다. (약...원) 같은 부가 설명은 뺍니다! 🕵️‍♀️📉✨
        const postPriceStr = krwPrice ? String(krwPrice) : "";
        const isPrice = !!krwPrice;

        return {
            original: g.combinedText,
            translated: finalTranslated + (postPriceStr ? ` (약 ${Number(postPriceStr).toLocaleString()}원)` : ""),
            description: finalTranslated, // v500: 업체의 'description' 규격 대응 ✨
            bbox: [g.cx, g.cy, g.width, g.height],
            vertices: [ // v500: 업체의 'vertices' 규격 대응 (List of points) ✨
                { x: Math.round(g.cx - g.width / 2), y: Math.round(g.cy - g.height / 2) },
                { x: Math.round(g.cx + g.width / 2), y: Math.round(g.cy - g.height / 2) },
                { x: Math.round(g.cx + g.width / 2), y: Math.round(g.cy + g.height / 2) },
                { x: Math.round(g.cx - g.width / 2), y: Math.round(g.cy + g.height / 2) }
            ],
            isPrice: isPrice, // v500: 업체의 'isPrice' 규격 대응 ✨
            postPrice: postPriceStr, // v500: 업체의 'postPrice' 규격 대응 ✨
            orientation: g.isVertical ? 'vertical' : 'horizontal', // v500: 업체의 'orientation' 규격 대응 ✨
            laneIdx: 0,
            angle: 0,
            isVertical: g.isVertical
        };
    });

    const processingTime = Date.now() - startTime;

    // v500: 업체의 '전체 응답 스키마(status, model, data, message)' 규격 최종 래핑! 🕵️‍♀️🎯✨🌈
    return NextResponse.json({ 
        status: "success",
        model: "tripflex-adaptive-hybrid-v500",
        data: [{
            imageId: `tripflex_${Date.now()}`,
            processingTime: processingTime,
            annotations: finalResults
        }],
        message: "OK",
        // 기존 프론트엔드 코드 호환을 위해 results 필드도 그대로 유지합니다! 😉
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
  
  // v380/v400: 전역 세로 지수(Global Verticality) 체크 🕵️‍♀️📊
  // 이미지 속에 '진짜 세로로 한 글자씩 있는 글자(bh > bw * 1.2)'가 거의 없다면 기둥 감지를 비활성화!
  // v400: 라틴어의 'I', 'l', '|' 등은 세로 글자 카운트에서 제외하여 오판 방지!
  const verticalCount = anns.filter(a => a.bh > a.bw * 1.5 && a.description.length > 1).length;
  const isGlobalVerticalScarcity = verticalCount < Math.max(3, anns.length * 0.05);

  const avgDensity = anns.length / 100;
  const pillarZones = xDensity
    .map((count, bin) => (count > Math.max(2, avgDensity * 1.6) && !isGlobalVerticalScarcity) ? bin * 10 : -1)
    .filter(val => val !== -1);

  let remaining = [...anns].sort((a, b) => (a.by + a.bh / 2) - (b.by + b.bh / 2));
  const groups: any[] = [];

  while (remaining.length > 0) {
    const ref = remaining[0];
    const refCenterX = ref.bx + ref.bw / 2;
    const refCenterY = ref.by + ref.bh / 2;
    const refIsCJK = isCJK(ref.description);
    const refIsNumeric = isNumericOnly(ref.description);
    
    // v400: 숫자는 기둥 감지 구역이라도 세로로 묶지 않고 옆 메뉴명을 찾게 유도!
    const isInsidePillar = !isGlobalVerticalScarcity && !refIsNumeric && pillarZones.some(zoneX => Math.abs(refCenterX - zoneX) < 15);
    
    let isPreferVertical = false;
    // v420: '가로 문장 우선권(Horizontal Sentence Priority)' 결정 🕵️‍♀️📖✨
    // 주변에 가깝게 붙어있는 '가로 이웃'이 있다면, 세로 거리가 아무리 가까워도 가로 병합을 먼저 시도합니다.
    let hasStrongHorizontalNeighbor = false;
    const candidates = remaining.filter(ann => ann !== ref);
    
    if (candidates.length > 0) {
      const neighbors = candidates.map(ann => {
        let dx = Math.max(0, ann.bx - (ref.bx + ref.bw), ref.bx - (ann.bx + ann.bw));
        const dy = Math.max(0, ann.by - (ref.by + ref.bh), ref.by - (ann.by + ann.bh));
        const yOverlap = Math.min(ann.by + ann.bh, ref.by + ref.bh) - Math.max(ann.by, ref.by);
        return { ann, dx, dy, yOverlap };
      });

      // 가로로 많이 겹치거나(yOverlap) 매우 가까운(dx < bh * 3.5) 이웃이 있으면 가로 모드 강제!
      hasStrongHorizontalNeighbor = neighbors.some(n => 
        (n.yOverlap > ref.bh * 0.4 && n.dx < ref.bh * 3.5) || 
        (n.dx < ref.bh * 0.5 && n.dy < ref.bh * 0.5)
      );

      const nearest = neighbors.map(n => {
        let dx_eff = n.dx;
        let dy_eff = n.dy;
        if (refIsCJK || refIsNumeric || isCJK(n.ann.description)) {
            dx_eff *= 0.5;
            dy_eff *= (refIsCJK ? 2.8 : 4.0); 
        }
        return { ...n, dx_eff, dy_eff, dist: Math.sqrt(dx_eff*dx_eff + dy_eff*dy_eff) };
      }).sort((a, b) => a.dist - b.dist)[0];

      if (hasStrongHorizontalNeighbor && !isInsidePillar) {
        isPreferVertical = false;
      } else if (nearest.yOverlap > nearest.ann.bh * 0.3 && nearest.dx < nearest.dy * 1.8) {
        isPreferVertical = false;
      } else if (nearest.dy_eff < nearest.dx_eff * 1.1) {
        isPreferVertical = true;
      } else {
        isPreferVertical = ref.bh > ref.bw * 1.5;
      }

      if (isInsidePillar && !refIsNumeric) {
        isPreferVertical = true;
      }
    } else {
      isPreferVertical = (ref.bh > ref.bw * 1.5) || (isInsidePillar && !refIsNumeric);
    }

    let rowIndices: number[] = [];
    
    if (isPreferVertical) {
      // 2-A. 세로 버킷(Column Bucket) 생성 ↕️🧺 - v430: 세로 방향 사회적 거리두기!
      rowIndices = remaining
        .map((ann, idx) => ({ 
          idx, 
          distX: Math.abs((ann.bx + ann.bw / 2) - refCenterX),
          distY: Math.max(0, ann.by - (ref.by + ref.bh), ref.by - (ann.by + ann.bh)),
          overlapX: Math.min(ann.bx + ann.bw, ref.bx + ref.bw) - Math.max(ann.bx, ref.bx)
        }))
        .filter(item => {
          const charH = Math.max(remaining[item.idx].bh, ref.bh);
          const isHorizontalNearby = item.distX < ref.bw * 0.7 || item.overlapX > Math.min(remaining[item.idx].bw, ref.bw) * 0.5;
          // 세로로 너무 멀면(h * 1.5) 같은 기둥이라도 묶지 않음!
          return isHorizontalNearby && item.distY < charH * 1.5;
        })
        .map(item => item.idx);
    } else {
      // 2-B. 가로 버킷(Row Bucket) 생성 ↔️🧺 - v420: 더욱 탄탄한 문장 병합!
      rowIndices = remaining
        .map((ann, idx) => {
          const dx = Math.max(0, ann.bx - (ref.bx + ref.bw), ref.bx - (ann.bx + ann.bw));
          const dy = Math.max(0, ann.by - (ref.by + ref.bh), ref.by - (ann.by + ann.bh));
          const yOverlap = Math.min(ann.by + ann.bh, ref.by + ref.bh) - Math.max(ann.by, ref.by);
          const distY = Math.abs((ann.by + ann.bh / 2) - refCenterY);
          const isNumericChain = refIsNumeric && isNumericOnly(ann.description);
          return { idx, dx, dy, distY, yOverlap, isNumericChain };
        })
        .filter(item => {
          const charH = Math.max(remaining[item.idx].bh, ref.bh);
          const gapLimit = item.isNumericChain ? charH * 3.0 : charH * 5.0;
          // 같은 행에 있거나(yOverlap) 아주 가까운 경우 병합!
          const isHorizontalNearby = item.yOverlap > charH * 0.3 || item.distY < charH * 0.5;
          return isHorizontalNearby && item.dx < gapLimit;
        })
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

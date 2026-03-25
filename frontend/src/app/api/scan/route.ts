import { NextResponse } from 'next/server';
import { logger } from '../../../lib/logger';

export async function POST(req: Request) {
  try {
    const { image, provider = 'azure' } = await req.json(); // base64 image data
    logger.api(`API Route 요청 수신됨! (Provider: ${provider}) 🚀`);

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const visionEndpoint = "https://tripflex-vision.cognitiveservices.azure.com";
    const visionKey = "8JEvyHe6zpdB1ekvXNk2TiFG18I19kf9EUizFmktm0ge1VJPS73uJQQJ99CCACNns7RXJ3w3AAAFACOGqzED";
    const GOOGLE_API_KEY = 'AIzaSyC91AhmOEPu3UH5kyxxLKqBGKgf9glaG6w'; // Recovered legacy key (v49)
    
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    let initialAnns: any[] = [];
    let imgWidth = 1000;
    let imgHeight = 1000;

    if (provider === 'google') {
        // --- [ENGINE: GOOGLE CLOUD VISION] ---
        const googleUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
        const googleRes = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requests: [{
                    image: { content: base64Data },
                    features: [{ type: 'TEXT_DETECTION' }]
                }]
            })
        });

        if (!googleRes.ok) throw new Error(`Google OCR Failed: ${googleRes.status}`);
        const googleData = await googleRes.json();
        const fullAnno = googleData.responses?.[0]?.fullTextAnnotation;
        const textAnnos = googleData.responses?.[0]?.textAnnotations || [];

        imgWidth = fullAnno?.pages?.[0]?.width || 1000;
        imgHeight = fullAnno?.pages?.[0]?.height || 1000;

        initialAnns = textAnnos.slice(1).map((anno: any) => {
            const vertices = anno.boundingPoly?.vertices || [];
            const bx = Math.min(...vertices.map((v: any) => v.x || 0));
            const by = Math.min(...vertices.map((v: any) => v.y || 0));
            const bw = Math.max(...vertices.map((v: any) => v.x || 0)) - bx;
            const bh = Math.max(...vertices.map((v: any) => v.y || 0)) - by;

            return {
                description: anno.description || '',
                vertices,
                bx, by, bw, bh
            };
        });
        logger.success("Google Vision OCR 분석 완료! ✅", { count: initialAnns.length });

    } else {
        // --- [ENGINE: AZURE AI VISION 4.0] ---
        const azureUrl = `${visionEndpoint}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=read`;
        const ocrResponse = await fetch(azureUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream', 'Ocp-Apim-Subscription-Key': visionKey },
            body: buffer
        });

        if (!ocrResponse.ok) throw new Error(`Azure OCR Failed: ${ocrResponse.status}`);
        const ocrData = await ocrResponse.json();
        
        imgWidth = ocrData.metadata?.width || ocrData.readResult?.width || ocrData.readResult?.pages?.[0]?.width || 1000;
        imgHeight = ocrData.metadata?.height || ocrData.readResult?.height || ocrData.readResult?.pages?.[0]?.height || 1000;

        const azureLines = ocrData.readResult?.blocks?.[0]?.lines || [];
        initialAnns = azureLines.map((line: any) => {
            const vertices = line.boundingPolygon || [];
            const bx = Math.min(...vertices.map((v: any) => v.x));
            const by = Math.min(...vertices.map((v: any) => v.y));
            const bw = Math.max(...vertices.map((v: any) => v.x)) - bx;
            const bh = Math.max(...vertices.map((v: any) => v.y)) - by;

            return {
                description: line.content || line.text || '',
                vertices,
                bx, by, bw, bh
            };
        });
        logger.success("Azure OCR 분석 완료! ✅", { count: initialAnns.length });
    }

    if (initialAnns.length === 0) {
        return NextResponse.json({ message: 'No text detected', results: [] });
    }

    // --- [v19: Universal Semantic Multi-Column Splitter] ---
    const lineAnnotations = initialAnns.flatMap((ann: any) => {
        const { description: text, vertices, bx, by, bw, bh } = ann;
        
        const splitIndices: number[] = [0];
        const splitterRegex = /\s+(?=\+[\d,]{2,}|[A-Z](\s+|$)|^\d{1,2}[\s.〉]|\[|大盛り|きます)/g;
        let match;
        while ((match = splitterRegex.exec(text)) !== null) {
            splitIndices.push(match.index + match[0].length);
        }
        splitIndices.push(text.length);

        if (splitIndices.length > 2) {
            const results = [];
            for (let i = 0; i < splitIndices.length - 1; i++) {
                const subText = text.substring(splitIndices[i], splitIndices[i+1]).trim();
                if (!subText) continue;

                const startRatio = splitIndices[i] / text.length;
                const endRatio = splitIndices[i+1] / text.length;
                const subWidth = bw * (endRatio - startRatio); // Remove + (imgWidth * 0.05) (v57)

                results.push({
                    description: subText,
                    originalBox: [bx + bw * startRatio, by, subWidth, bh]
                });
            }
            return results;
        }

        return [{
            description: text,
            originalBox: [bx, by, bw, bh]
        }];
    });

    // --- [STEP 2: HIERARCHICAL X-SEGMENTER Engine (v60)] ---
    // 1. Detect Gutters (Empty vertical lanes) using Bit-Array Occupation
    const xOccupation = new Uint8Array(1001); // 0.1% precision
    lineAnnotations.forEach(ann => {
        const start = Math.max(0, Math.floor((ann.originalBox[0] / imgWidth) * 1000));
        const end = Math.min(1000, Math.ceil(((ann.originalBox[0] + ann.originalBox[2]) / imgWidth) * 1000));
        for (let x = start; x <= end; x++) xOccupation[x] = 1;
    });

    // 2. Define Lanes based on Gutter detection (Gutter threshold: 2.5% imgWidth)
    const lanes: { start: number, end: number }[] = [];
    let inLane = false;
    let laneStart = 0;
    const gutterThreshold = 25; // 2.5% of 1000
    
    // Initial scan to find active areas
    for (let x = 0; x <= 1000; x++) {
        if (xOccupation[x] === 1 && !inLane) {
            inLane = true;
            laneStart = x;
        } else if (inLane) {
            // check if gutter is coming
            let isGutter = true;
            for (let g = 0; g < gutterThreshold && (x + g) <= 1000; g++) {
                if (xOccupation[x + g] === 1) { isGutter = false; break; }
            }
            if (isGutter || x === 1000) {
                lanes.push({ start: laneStart / 10, end: (x - 1) / 10 });
                inLane = false;
            }
        }
    }

    logger.api(`자율 구역 감지 완료: ${lanes.length}개 구역 발견 🕵️‍♀️`);

    // 3. Assign items to Lanes and perform Local Row Grouping
    const laneGroups: any[][] = lanes.map(() => []);
    lineAnnotations.forEach(ann => {
        const centerX = (ann.originalBox[0] + ann.originalBox[2]/2) / imgWidth * 100;
        let bestLane = 0;
        let minDist = 1000;
        lanes.forEach((lane, idx) => {
            const dist = Math.abs(centerX - (lane.start + lane.end) / 2);
            if (dist < minDist) { minDist = dist; bestLane = idx; }
        });
        laneGroups[bestLane].push(ann);
    });

    const finalGroups: any[] = [];
    laneGroups.forEach((laneItems, laneIdx) => {
        if (laneItems.length === 0) return;
        
        // Local Row Grouping inside each lane
        const sortedLaneItems = [...laneItems].sort((a, b) => a.originalBox[1] - b.originalBox[1]);
        const hts = sortedLaneItems.map(a => a.originalBox[3]).sort((a, b) => a - b);
        const medianH = hts[Math.floor(hts.length / 2)] || imgHeight * 0.03;
        const vThreshold = medianH * 0.45;

        let currentGroup = [sortedLaneItems[0]];
        for (let i = 1; i < sortedLaneItems.length; i++) {
            const last = currentGroup[currentGroup.length - 1];
            const current = sortedLaneItems[i];
            
            const avgY = currentGroup.reduce((sum, item) => sum + item.originalBox[1], 0) / currentGroup.length;
            const vDiff = Math.abs(avgY - current.originalBox[1]);
            const isSameRow = vDiff < vThreshold;
            
            // v60: Lane-local horizontal merging logic
            const hGap = current.originalBox[0] - (last.originalBox[0] + last.originalBox[2]);
            const isNearH = hGap < (imgWidth * 0.1); // more generous in-lane merging

            if (isSameRow && isNearH) {
                currentGroup.push(current);
            } else {
                finalGroups.push({ items: currentGroup, laneIdx });
                currentGroup = [current];
            }
        }
        finalGroups.push({ items: currentGroup, laneIdx });
    });

    const groups = finalGroups; // Re-alias for the rest of the logic

    const finalResults: any[] = [];

    const resultsToTranslate = groups.map(res => {
        const group = res.items;
        group.sort((a, b) => a.originalBox[0] - b.originalBox[0]);
        return {
            combinedText: group.map(p => p.description).join(' '),
            group,
            laneIdx: res.laneIdx, // (v60)
            minX: Math.min(...group.map(p => p.originalBox[0])),
            minY: Math.min(...group.map(p => p.originalBox[1])),
            maxX: Math.max(...group.map(p => p.originalBox[0] + p.originalBox[2])),
            maxY: Math.max(...group.map(p => p.originalBox[1] + p.originalBox[3])),
        };
    });

    // --- STEP 3: DIRECT AZURE TRANSLATION (v38: No Relay, 100% Stability) ---
    const TRANSLATOR_KEY = "9efQFjs3tGh1XWUO8wjMx1WDDYyqS4kdoHy1jRwFUfPbNu5ExDFRJQQJ99CCACNns7RXJ3w3AAAbACOGd4dd";
    const TRANSLATOR_REGION = "koreacentral";
    const TRANSLATOR_URL = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=ko&from=ja";

    const azureBatchPayload = resultsToTranslate.map(res => ({ Text: res.combinedText }));

    try {
        logger.api(`공식 Azure 직통 번역 중... (${azureBatchPayload.length}개 그룹) 🚄`);
        const translatorRes = await fetch(TRANSLATOR_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Ocp-Apim-Subscription-Key': TRANSLATOR_KEY,
                'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION
            },
            body: JSON.stringify(azureBatchPayload)
        });

        if (translatorRes.ok) {
            const translatedData = await translatorRes.json();
            
            resultsToTranslate.forEach((res, idx) => {
                // Azure 3.0 returns [{ translations: [{ text: "...", to: "ko" }] }]
                const translatedText = translatedData[idx]?.translations?.[0]?.text || res.combinedText;
                
                // Final Normalization: Convert raw pixels to percentages for frontend % styling (v46)
                const normX = (res.minX / imgWidth) * 100;
                const normY = (res.minY / imgHeight) * 100;
                const normW = ((res.maxX - res.minX) / imgWidth) * 100;
                const normH = ((res.maxY - res.minY) / imgHeight) * 100;

                finalResults.push({
                    original: res.combinedText,
                    translated: translatedText,
                    boundingBox: [normX, normY, normW, normH],
                    lineCount: res.group.length,
                    laneIdx: res.laneIdx // v60
                });
            });
            logger.success(`정규화 번역 완료! ✅ (Items: ${finalResults.length})`);
        } else {
            logger.error(`Azure API 에러: ${translatorRes.status}`);
            resultsToTranslate.forEach((res) => {
                const unifiedBox = [res.minX, res.minY, res.maxX - res.minX, res.maxY - res.minY];
                finalResults.push({
                    original: res.combinedText,
                    translated: res.combinedText,
                    boundingBox: unifiedBox,
                    lineCount: res.group.length
                });
            });
        }
    } catch (e) {
        logger.error('Direct Azure Error:', e);
    }

    logger.api("최종 결과 반환 중! ✨", { items: finalResults.length });
    return NextResponse.json({ results: finalResults, imgWidth, imgHeight, aspectRatio: imgWidth / imgHeight });

  } catch (error: any) {
    console.error('SERVER ERROR:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}

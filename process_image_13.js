const fs = require('fs');
const path = require('path');

async function processImage13() {
    const relayUrl = 'http://3.36.126.196:3000/api/relay';
    const bearerToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiYWNrZW5kIiwiYXV0aCI6WyJST0xFX0JBQ0tFTkQiXSwiaWF0IjoxNzY3MzQyMDgyLCJleHAiOjE3Njc0Mjg0ODJ9.ly-U2_gd0otXT5IkbsWSjeA6s0-F4gRICV94JkuEXcw';
    const ocrPath = 'c:/Mayoube/TripFlex/ocr_jp_13.json';
    const imagePath = 'c:/Mayoube/TripFlex/샘플이미지/JP(JAPAN)/JP_image_013.jpg';

    try {
        // 1. Read OCR result
        console.log('--- Reading OCR Data...');
        const ocrData = JSON.parse(fs.readFileSync(ocrPath, 'utf8'));
        
        // 2. Prepare Request Data
        const requestObject = {
            data: [
                {
                    imageId: "JP_image_013",
                    userId: "tripflex-demo-user",
                    requestId: "req-" + Date.now().toString(),
                    imagePath: "/image/JP_image_013.jpg",
                    ocr_latency: 120.0,
                    annotations: ocrData.textAnnotations 
                }
            ],
            country: "KR"
        };

        // 3. Call Relay API
        console.log('--- Sending to Relay API...');
        const response = await fetch(relayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerToken
            },
            body: JSON.stringify(requestObject)
        });

        console.log(`--- API Status: ${response.status} ${response.statusText}`);
        const responseData = await response.json();
        fs.writeFileSync('c:/Mayoube/TripFlex/translated_jp_13.json', JSON.stringify(responseData, null, 2));
        console.log('--- Saved response to translated_jp_13.json ---');

        // 4. Generate Dynamic HTML Overlay
        console.log('--- Generating Dynamic HTML Overlay...');
        const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
        
        const translatedItems = responseData.data && responseData.data[0] && responseData.data[0].annotations 
            ? responseData.data[0].annotations 
            : [];

        if (translatedItems.length === 0) {
            console.log('--- No annotations found in response. Using OCR data as fallback.');
            translatedItems.push(...ocrData.textAnnotations);
        }

        let overlayHtml = '';
        // Skip index 0 as it's typically the full text summary
        translatedItems.slice(1).forEach((item, index) => {
            const poly = item.vertices || (item.boundingPoly && item.boundingPoly.vertices);
            if (!poly || poly.length < 4) return;

            const left = Math.min(...poly.map(v => v.x || 0));
            const top = Math.min(...poly.map(v => v.y || 0));
            const right = Math.max(...poly.map(v => v.x || 0));
            const bottom = Math.max(...poly.map(v => v.y || 0));
            const width = right - left;
            const height = bottom - top;
            const text = item.description || "";

            // Premium styling based on item type
            const isPrice = item.isPrice === true; // Explicit check for API's boolean
            const bgClass = isPrice ? 'price-overlay' : 'text-overlay';

            overlayHtml += `
            <div class="overlay ${bgClass}" style="left:${left}px; top:${top}px; width:${width}px; height:${height}px;">
                <span class="text-content">${text}</span>
            </div>`;
        });

        const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@700&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; padding: 0; background: #0f172a; overflow-x: hidden; font-family: 'Pretendard', sans-serif; }
        .container { position: relative; width: 750px; height: 1127px; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.1); }
        img { display: block; width: 100%; height: 100%; filter: brightness(0.6) contrast(1.1); }
        .overlay { 
            position: absolute; 
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            border-radius: 4px;
            white-space: pre-wrap;
            text-align: center;
            line-height: 1.2;
            pointer-events: none;
            backdrop-filter: blur(2px);
            transition: all 0.3s ease;
        }
        .text-overlay {
            background: linear-gradient(135deg, rgba(255, 230, 0, 0.9), rgba(255, 200, 0, 0.95));
            color: #000;
            border: 1.5px solid #000;
            font-size: 14px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .price-overlay {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95));
            color: #fff;
            border: 1.5px solid rgba(255,255,255,0.3);
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }
        .text-content { padding: 2px 4px; }
        .header { position: absolute; top: 0; left: 0; width: 100%; height: 60px; background: rgba(0,0,0,0.6); backdrop-filter: blur(10px); display: flex; align-items: center; padding: 0 20px; color: #fff; z-index: 100; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .status-badge { background: #22c55e; color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 20px; font-weight: bold; margin-left: auto; }
    </style>
</head>
<body>
    <div class="header">
        <span style="font-weight: bold; font-size: 18px;">TripFlex Translation Preview - JP_013</span>
        <div class="status-badge">API RELAY SUCCESS</div>
    </div>
    <div class="container">
        <img src="data:image/jpeg;base64,${imageBase64}">
        ${overlayHtml}
    </div>
</body>
</html>
`;

        fs.writeFileSync('c:/Mayoube/TripFlex/overlay_jp_13_dynamic.html', html);
        console.log('--- Dynamic HTML Overlay created with Premium Styles ---');

    } catch (error) {
        console.error('--- Error:', error.message);
    }
}

processImage13();

const fs = require('fs');
const imagePath = 'c:/Mayoube/TripFlex/샘플이미지/JP(JAPAN)/JP_image_012.jpg';
const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

const overlays = [
    { left: 30, top: 10, width: 100, height: 18, text: "반테이 1주년" },
    { left: 30, top: 28, width: 60, height: 12, text: "토마치점", size: 8 },
    { left: 60, top: 35, width: 80, height: 18, text: "한정 이벤트" },
    { left: 20, top: 62, width: 40, height: 15, text: "6월 1일", size: 9 },
    { left: 20, top: 85, width: 100, height: 20, text: "시로 라멘" },
    { left: 20, top: 110, width: 100, height: 25, text: "1그릇 100엔", size: 14 }
];

let overlayHtml = '';
overlays.forEach(o => {
    overlayHtml += `<div class="overlay" style="left:${o.left}px; top:${o.top}px; width:${o.width}px; height:${o.height}px; font-size:${o.size || 11}px;">${o.text}</div>`;
});

const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; padding: 0; background: #222; overflow: hidden; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .container { position: relative; width: 157px; height: 165px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        img { display: block; width: 100%; height: 100%; filter: brightness(0.6); }
        .overlay { 
            position: absolute; 
            background: rgba(255, 255, 255, 0.9); 
            color: #e65100; 
            font-family: 'Malgun Gothic', sans-serif; 
            font-weight: bold; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 2px;
            border: 1px solid #e65100;
            white-space: nowrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="data:image/jpeg;base64,${imageBase64}">
        ${overlayHtml}
    </div>
</body>
</html>
`;

fs.writeFileSync('c:/Mayoube/TripFlex/overlay_jp_12.html', html);
console.log('--- HTML Overlay 12 created ---');

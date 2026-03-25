const fs = require('fs');
const imagePath = 'c:/Mayoube/TripFlex/샘플이미지/JP(JAPAN)/JP_image_013.jpg';
const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

const overlays = [
    { left: 192, top: 32, width: 200, height: 35, text: "소프트 드링크" },
    { left: 110, top: 100, width: 150, height: 25, text: "흑우롱차" },
    { left: 110, top: 160, width: 140, height: 25, text: "우롱차" },
    { left: 110, top: 200, width: 140, height: 25, text: "코카콜라" },
    { left: 110, top: 235, width: 140, height: 25, text: "진저에일" },
    { left: 110, top: 273, width: 160, height: 25, text: "100% 오렌지" },
    { left: 110, top: 310, width: 160, height: 25, text: "100% 애플" },
    { left: 110, top: 351, width: 140, height: 25, text: "칼피스" },
    { left: 110, top: 391, width: 140, height: 25, text: "사이다" },
    { left: 311, top: 588, width: 150, height: 35, text: "디저트" },
    { left: 108, top: 651, width: 350, height: 35, text: "바닐라 아이스크림 (초코/흑당)" },
    { left: 108, top: 739, width: 250, height: 30, text: "말차 아이스크림" },
    { left: 108, top: 785, width: 250, height: 30, text: "카라멜 아이스크림" },
    { left: 108, top: 979, width: 250, height: 30, text: "유자 샤베트" },
    { left: 108, top: 1025, width: 250, height: 30, text: "딸기 샤베트" }
];

let overlayHtml = '';
overlays.forEach(o => {
    overlayHtml += `<div class="overlay" style="left:${o.left}px; top:${o.top}px; width:${o.width}px; height:${o.height}px;">${o.text}</div>`;
});

const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; padding: 0; background: #222; overflow-x: hidden; }
        .container { position: relative; width: 750px; height: 1127px; margin: 20px auto; }
        img { display: block; width: 100%; height: 100%; filter: brightness(0.6); }
        .overlay { 
            position: absolute; 
            background: rgba(255, 230, 0, 0.95); 
            color: #000; 
            font-family: 'Malgun Gothic', 'Dotum', sans-serif; 
            font-weight: bold; 
            font-size: 16px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border-radius: 4px;
            box-shadow: 2px 2px 8px rgba(0,0,0,0.4);
            border: 2px solid #000;
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

fs.writeFileSync('c:/Mayoube/TripFlex/overlay_jp_13.html', html);
console.log('--- HTML Overlay 13 FIXED created ---');

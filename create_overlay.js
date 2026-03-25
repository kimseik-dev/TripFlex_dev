const fs = require('fs');
const path = require('path');

const imagePath = 'c:/Mayoube/TripFlex/샘플이미지/JP(JAPAN)/JP_image_014.jpg';
const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

const overlays = [
    { left: 10, top: 65, width: 148, height: 20, text: "13. 마무시 <특상>" },
    { left: 48, top: 92, width: 58, height: 15, text: "3,200엔" },
    { left: 10, top: 131, width: 127, height: 20, text: "14. 마무시 <상>" },
    { left: 49, top: 158, width: 57, height: 15, text: "2,700엔" },
    { left: 11, top: 196, width: 124, height: 20, text: "15. 마무시 <중>" },
    { left: 49, top: 222, width: 58, height: 15, text: "2,200엔" },
    { left: 192, top: 211, width: 126, height: 24, text: "16. 장어 양념구이" },
    { left: 329, top: 211, width: 61, height: 18, text: "2,500엔" }
];

let overlayHtml = '';
overlays.forEach(o => {
    overlayHtml += `<div class="overlay" style="left:${o.left}px; top:${o.top}px; width:${o.width}px; height:${o.height}px;">${o.text}</div>`;
});

const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background: #1a1a1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
        .container { position: relative; width: 466px; height: 253px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; overflow: hidden; }
        img { display: block; width: 100%; height: 100%; filter: brightness(0.7); }
        .overlay { 
            position: absolute; 
            background: rgba(255, 255, 255, 0.9); 
            color: #d32f2f; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-weight: bold; 
            font-size: 11px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 1px solid #d32f2f; 
            border-radius: 2px;
            box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
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

fs.writeFileSync('c:/Mayoube/TripFlex/overlay_japan.html', html);
console.log('--- HTML Overlay created: overlay_japan.html ---');

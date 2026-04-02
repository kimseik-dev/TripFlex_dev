const fs = require('fs');

async function relayOcrData() {
    const relayUrl = 'http://3.36.126.196:3000/api/relay';
    const bearerToken = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiYWNrZW5kIiwiYXV0aCI6WyJST0xFX0JBQ0tFTkQiXSwiaWF0IjoxNzY3MzQyMDgyLCJleHAiOjE3Njc0Mjg0ODJ9.ly-U2_gd0otXT5IkbsWSjeA6s0-F4gRICV94JkuEXcw';
    const imagePath = 'c:/Mayoube/TripFlex/샘플이미지/KR(KOREA)/KR_image_001.jpg';

    try {
        // 1. Read OCR result (already saved)
        const ocrData = JSON.parse(fs.readFileSync('c:/Mayoube/TripFlex/ocr_result.json', 'utf8'));
        const fullText = ocrData.textAnnotations[0].description;
        
        // 2. Read Image as Base64
        const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });

        // 3. Prepare Integrated Request Data (Relay Format)
        // Correct structure using Google Vision annotations
        const requestObject = {
            data: [
                {
                    imageId: "KR_image_001",
                    annotations: ocrData.textAnnotations 
                }
            ],
            country: "KR"
        };

        console.log('--- Sending Integrated Data (OCR + Image + Metadata) to Relay API...');
        const response = await fetch(relayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': bearerToken
            },
            body: JSON.stringify(requestObject)
        });

        console.log(`--- Relay API Status: ${response.status} ${response.statusText}`);
        const responseBody = await response.text();
        console.log('--- Relay API Response:', responseBody);

    } catch (error) {
        console.error('--- Integration Error:', error.message);
    }
}

relayOcrData();

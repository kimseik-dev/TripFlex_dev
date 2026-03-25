const fs = require('fs');

async function runOcr() {
    const apiKey = 'AIzaSyC91AhmOEPu3UH5kyxxLKqBGKgf9glaG6w';
    const filePath = 'c:/Mayoube/TripFlex/샘플이미지/KR(KOREA)/KR_image_001.jpg';
    const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    try {
        const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });
        
        const requestBody = {
            requests: [
                {
                    image: { content: imageBase64 },
                    features: [{ type: 'TEXT_DETECTION' }]
                }
            ]
        };

        console.log('--- Calling Google Cloud Vision API...');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.responses && data.responses[0].textAnnotations) {
            const fullText = data.responses[0].textAnnotations[0].description;
            console.log('--- OCR Result Success! ---');
            console.log(fullText);
            
            // Save result to a file for later use in Relay API
            fs.writeFileSync('c:/Mayoube/TripFlex/ocr_result.json', JSON.stringify(data.responses[0], null, 2));
            console.log('--- Full result saved to ocr_result.json ---');
        } else {
            console.log('--- No text found or Error in response ---');
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('--- OCR Script Error:', error.message);
    }
}

runOcr();

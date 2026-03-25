import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '../.env' });

async function testOcr() {
  const imagePath = path.join(process.cwd(), '../샘플이미지/JP(JAPAN)/JP_image_013.jpg');
  console.log('Testing with image:', imagePath);

  if (!fs.existsSync(imagePath)) {
    console.error('Image not found!');
    return;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const visionEndpoint = (process.env.VITE_AZURE_VISION_ENDPOINT || '').trim().replace(/\/$/, '');
  const visionKey = (process.env.VITE_AZURE_VISION_KEY || '').trim();

  console.log('Credentials Check:', { visionEndpoint, hasKey: !!visionKey });

  const ocrUrl = `${visionEndpoint}/computervision/imageanalysis:analyze?api-version=2023-02-01-preview&features=read`;
  
  try {
    const response = await fetch(ocrUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': visionKey,
      },
      body: imageBuffer
    });

    const data = await response.json();
    console.log('OCR Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testOcr();

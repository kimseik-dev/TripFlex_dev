// Node.js 18+ uses native fetch, no need for node-fetch
async function testKeys() {
  const visionKey = "9efQFjs3tGh1XWUO8wjMx1WDDYyqS4kdoHy1jRwFUfPbNu5ExDFRJQQJ99CCACNns7RXJ3w3AAAbACOGd4dd";
  const translatorKey = "9efQFjs3tGh1XWUO8wjMx1WDDYyqS4kdoHy1jRwFUfPbNu5ExDFRJQQJ99CCACNns7RXJ3w3AAAbACOGd4dd";
  
  console.log('--- TEST 1: Translator with this Key ---');
  const transUrl = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=ko`;
  try {
    const res = await fetch(transUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': translatorKey,
        'Ocp-Apim-Subscription-Region': 'koreacentral',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text: 'Hello' }])
    });
    console.log('Translator Status:', res.status);
    const data = await res.json();
    console.log('Translator Response:', JSON.stringify(data));
  } catch (e) {
    console.error('Translator Test Failed:', e.message);
  }

  console.log('\n--- TEST 2: Vision with this Key ---');
  const visionUrl = `https://tripflex-vision.cognitiveservices.azure.com/vision/v3.2/ocr?language=en`;
  try {
    const res = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': visionKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-sample-data-files/master/ComputerVision/Images/printed_text.jpg' })
    });
    console.log('Vision Status:', res.status);
    const data = await res.json();
    console.log('Vision Response:', JSON.stringify(data));
  } catch (e) {
    console.error('Vision Test Failed:', e.message);
  }
}

testKeys();

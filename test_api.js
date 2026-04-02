const fs = require('fs');

async function testApi() {
    const url = 'http://3.36.126.196:3000/api/relay';
    const token = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJiYWNrZW5kIiwiYXV0aCI6WyJST0xFX0JBQ0tFTkQiXSwiaWF0IjoxNzY3MzQyMDgyLCJleHAiOjE3Njc0Mjg0ODJ9.ly-U2_gd0otXT5IkbsWSjeA6s0-F4gRICV94JkuEXcw';
    
    try {
        const requestData = JSON.parse(fs.readFileSync('c:/Mayoube/TripFlex/request.json', 'utf8'));
        
        console.log('--- Sending Request to:', url);
        console.log('--- Metadata:', { category: requestData[0].category, text_length: requestData[0].text.length });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(requestData)
        });

        const status = response.status;
        const statusText = response.statusText;
        console.log(`--- Response Status: ${status} ${statusText}`);

        const responseBody = await response.text();
        console.log('--- Response Body:', responseBody);

    } catch (error) {
        console.error('--- Error:', error.message);
    }
}

testApi();

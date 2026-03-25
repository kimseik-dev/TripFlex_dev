import createClient from "@azure-rest/ai-vision-image-analysis";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = import.meta.env.VITE_AZURE_VISION_ENDPOINT;
const key = import.meta.env.VITE_AZURE_VISION_KEY;

const credential = new AzureKeyCredential(key);
const client = createClient(endpoint, credential);

/**
 * 이미지 파일에서 텍스트와 좌표를 추출합니다.
 * @param {File | Blob} imageFile - 분석할 이미지 파일
 * @returns {Promise<Array>} - 추출된 텍스트와 좌표 데이터 배열
 */
export async function performOCR(imageFile) {
  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const response = await client.path("/analyze").post({
      body: new Uint8Array(arrayBuffer),
      contentType: "application/octet-stream",
      queryParameters: {
        features: ["Read"],
      },
    });

    if (response.status !== "200") {
      throw response.body;
    }

    const ocrData = [];
    if (response.body.readResult) {
      response.body.readResult.blocks.forEach((block) => {
        block.lines.forEach((line) => {
          ocrData.push({
            text: line.text,
            boundingPolygon: line.boundingPolygon, // [x1, y1, x2, y2, x3, y3, x4, y4]
            words: line.words.map((word) => ({
              text: word.text,
              confidence: word.confidence,
            })),
          });
        });
      });
    }
    return ocrData;
  } catch (error) {
    console.error("OCR Analysis failed:", error);
    throw error;
  }
}

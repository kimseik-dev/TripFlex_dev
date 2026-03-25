import createClient from "@azure-rest/ai-translation-text";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = import.meta.env.VITE_AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";
const key = import.meta.env.VITE_AZURE_TRANSLATOR_KEY;
const region = import.meta.env.VITE_AZURE_TRANSLATOR_REGION;

const credential = new AzureKeyCredential(key);
const client = createClient(endpoint, credential, { region });

/**
 * 텍스트 배열을 번역합니다.
 * @param {Array<string>} texts - 번역할 텍스트 배열
 * @param {string} to - 목표 언어 (기본값: 'ko')
 * @returns {Promise<Array>} - 번역된 결과 배열
 */
export async function translateTexts(texts, to = "ko") {
  try {
    const response = await client.path("/translate").post({
      body: texts.map((text) => ({ text })),
      queryParameters: {
        to,
        "api-version": "3.0",
      },
    });

    if (response.status !== "200") {
      throw response.body;
    }

    return response.body.map((item) => ({
      translatedText: item.translations[0].text,
      detectedLanguage: item.detectedLanguage?.language,
    }));
  } catch (error) {
    console.error("Translation failed:", error);
    throw error;
  }
}

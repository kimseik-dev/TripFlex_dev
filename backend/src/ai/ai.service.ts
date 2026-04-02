import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

  constructor(private configService: ConfigService) {}

  async processImage(imageBuffer: Buffer) {
    try {
      this.logger.log('Starting Google OCR process... 👁️✨');
      const apiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');
      
      if (!apiKey) {
        throw new Error('Google Vision API Key is missing in environment! 🔑');
      }

      const base64Image = imageBuffer.toString('base64');
      
      const response = await axios.post(`${this.GOOGLE_VISION_URL}?key=${apiKey}`, {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      });

      const annotation = response.data.responses?.[0]?.textAnnotations;
      if (!annotation || annotation.length === 0) {
        this.logger.warn('No text detected in the image. 🕵️‍♀️');
        return [];
      }

      // v310: Google OCR 결과를 기존의 Azure 인터페이스에 맞춰 매핑합니다. 📐
      // annotation[0]은 전체 텍스트이므로, 개별 단어 단위인 [1:]부터 처리합니다.
      const textItems = annotation.slice(1).map((anno: any) => {
        const vertices = anno.boundingPoly?.vertices || [];
        return {
          text: anno.description || '',
          // Azure boundingPolygon 형식을 흉내냅니다 (x, y 좌표 리스트)
          boundingPolygon: vertices.flatMap((v: any) => [v.x || 0, v.y || 0]),
          translatedText: '', // 추후 번역 로직 추가 가능
        };
      });

      this.logger.log(`Found ${textItems.length} text items via Google Cloud Vision! ✅`);
      
      // 번역 로직 (v310 Restored!) - 구글은 OCR 결과에 기본 번역이 없으므로, 
      // 필요시 Google Translate API를 추가로 호출해야 하지만, 현재는 원문 그대로 반환합니다.
      // (Azure Translator를 대체할 로직이 필요하다면 여기에 추가)
      return textItems;

    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Error processing image with Google Vision: ${errorMsg} ❌`);
      throw new Error(`Google OCR Failed: ${errorMsg}`);
    }
  }
}

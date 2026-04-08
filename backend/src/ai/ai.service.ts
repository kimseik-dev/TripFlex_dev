import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

  constructor(private configService: ConfigService) {}

  private isPrice(text: string): boolean {
    const t = text.trim();
    // 앞에 통화기호: € 22,00 / $ 9.50 / ¥ 500
    if (/^[€$£¥₩]\s?\d+([.,]\d+)?\*?$/.test(t)) return true;
    // 뒤에 통화기호: 22,00 € / 9.50 €
    if (/^\d+([.,]\d+)?\s?[€$£¥₩]\*?$/.test(t)) return true;
    // 기호 없이 숫자만: 9,50 / 13.50
    if (/^\d+([.,]\d+)\*?$/.test(t)) return true;
    // 복수 가격(같은 행 병합): "2.50 3.50" / "3.50 4.10 4.50" / "1.85 2.05 2.25*"
    if (/^(\d+[.,]\d+\*?\s+)+\d+[.,]\d+\*?$/.test(t)) return true;
    return false;
  }

  private getOrientation(vertices: { x: number; y: number }[]): string {
    if (vertices.length < 2) return 'horizontal';
    const width = Math.abs((vertices[1]?.x || 0) - (vertices[0]?.x || 0));
    const height = Math.abs((vertices[2]?.y || 0) - (vertices[0]?.y || 0));
    return width >= height ? 'horizontal' : 'vertical';
  }

  async processImage(imageBuffer: Buffer) {
    const startTime = Date.now();

    try {
      this.logger.log('Starting Google OCR process...');
      const apiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');

      if (!apiKey) {
        throw new Error('Google Vision API Key is missing in environment!');
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
      this.logger.log('Raw Google Vision Annotations: ' + JSON.stringify(annotation, null, 2));

      if (!annotation || annotation.length === 0) {
        this.logger.warn('No text detected in the image.');
        return {
          status: 'success',
          model: 'google-cloud-vision',
          data: [
            {
              imageId: uuidv4(),
              processingTime: Date.now() - startTime,
              annotations: [],
            },
          ],
          message: 'No text detected in the image.',
        };
      }

      // annotation[0]은 전체 텍스트이므로 개별 단어 단위인 [1:]부터 처리
      const annotations = annotation.slice(1).map((anno: any) => {
        const vertices: { x: number; y: number }[] = (anno.boundingPoly?.vertices || []).map(
          (v: any) => ({ x: v.x || 0, y: v.y || 0 }),
        );
        const description: string = anno.description || '';
        const priceFlag = this.isPrice(description);

        return {
          description,
          vertices,
          isPrice: priceFlag,
          postPrice: priceFlag ? description : '',
          orientation: this.getOrientation(vertices),
        };
      });

      this.logger.log(`Found ${annotations.length} text items via Google Cloud Vision!`);

      return {
        status: 'success',
        model: 'google-cloud-vision',
        data: [
          {
            imageId: uuidv4(),
            processingTime: Date.now() - startTime,
            annotations,
          },
        ],
        message: `Successfully detected ${annotations.length} text items.`,
      };

    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      this.logger.error(`Error processing image with Google Vision: ${errorMsg}`);
      throw new Error(`Google OCR Failed: ${errorMsg}`);
    }
  }
}

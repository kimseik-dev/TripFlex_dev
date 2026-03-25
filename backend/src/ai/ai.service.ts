import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import createVisionClient from '@azure-rest/ai-vision-image-analysis';
import createTranslationClient from '@azure-rest/ai-translation-text';
import { AzureKeyCredential } from '@azure/core-auth';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private visionClient: any;
  private translationClient: any;

  constructor(private configService: ConfigService) {
    const visionEndpoint = this.configService.get<string>('AZURE_VISION_ENDPOINT');
    const visionKey = this.configService.get<string>('AZURE_VISION_KEY');
    const translationEndpoint = this.configService.get<string>('AZURE_TRANSLATOR_ENDPOINT');
    const translationKey = this.configService.get<string>('AZURE_TRANSLATOR_KEY');
    const translationRegion = this.configService.get<string>('AZURE_TRANSLATOR_REGION');

    this.visionClient = createVisionClient(visionEndpoint!, { key: visionKey! });
    this.translationClient = createTranslationClient(translationEndpoint!, { key: translationKey!, region: translationRegion! });
  }

  async processImage(imageBuffer: Buffer) {
    try {
      this.logger.log('Starting OCR process...');
      const visionResponse = await this.visionClient.path('/analyze').post({
        body: imageBuffer,
        queryParameters: { features: ['Read'] },
        contentType: 'application/octet-stream',
      });

      if (visionResponse.status !== '200') {
        throw new Error(`Vision API error: ${visionResponse.body.error?.message}`);
      }

      const readResult = visionResponse.body.readResult;
      const textItems: { text: string; boundingPolygon: any; translatedText?: string }[] = [];

      for (const block of readResult.blocks) {
        for (const line of block.lines) {
          textItems.push({
            text: line.text,
            boundingPolygon: line.boundingPolygon,
          });
        }
      }

      if (textItems.length === 0) return [];

      this.logger.log(`Found ${textItems.length} text items. Starting translation...`);
      const translationResponse: any = await this.translationClient.path('/translate').post({
        body: textItems.map(item => ({ text: item.text })),
        queryParameters: { to: 'ko', from: 'en' },
      });

      const translations = translationResponse.body;
      
      return textItems.map((item, index) => ({
        ...item,
        translatedText: translations[index].translations[0].text,
      }));
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`);
      throw error;
    }
  }
}

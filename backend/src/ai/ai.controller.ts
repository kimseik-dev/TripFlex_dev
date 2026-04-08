import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('scan')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: '메뉴 이미지 OCR 스캔',
    description: '이미지를 업로드하면 Google Cloud Vision으로 텍스트를 감지하고, 각 텍스트 항목의 위치·가격 여부·방향을 반환합니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: '분석할 메뉴 이미지 파일 (jpg, png 등)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OCR 성공',
    schema: {
      example: {
        status: 'success',
        model: 'google-cloud-vision',
        message: 'Successfully detected 42 text items.',
        data: [
          {
            imageId: 'uuid-v4',
            processingTime: 1234,
            annotations: [
              {
                description: 'Wiener Schnitzel',
                vertices: [
                  { x: 100, y: 50 },
                  { x: 300, y: 50 },
                  { x: 300, y: 80 },
                  { x: 100, y: 80 },
                ],
                isPrice: false,
                postPrice: '',
                orientation: 'horizontal',
              },
              {
                description: '€ 18,50',
                vertices: [
                  { x: 350, y: 50 },
                  { x: 430, y: 50 },
                  { x: 430, y: 80 },
                  { x: 350, y: 80 },
                ],
                isPrice: true,
                postPrice: '€ 18,50',
                orientation: 'horizontal',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '이미지 파일 없음',
    schema: { example: { statusCode: 400, message: 'No image uploaded' } },
  })
  @ApiResponse({
    status: 500,
    description: 'OCR 처리 오류',
    schema: {
      example: {
        status: 'error',
        model: 'google-cloud-vision',
        data: [],
        message: 'Google OCR Failed: ...',
      },
    },
  })
  async scanImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No image uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.aiService.processImage(file.buffer);
    } catch (error) {
      throw new HttpException(
        {
          status: 'error',
          model: 'google-cloud-vision',
          data: [],
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

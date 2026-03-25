import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('scan')
  @UseInterceptors(FileInterceptor('image'))
  async scanImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No image uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const results = await this.aiService.processImage(file.buffer);
      return { success: true, results };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

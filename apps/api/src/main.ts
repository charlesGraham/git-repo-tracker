import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Get configuration
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  
  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  
  // Start the server
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`GraphQL Playground available at: http://localhost:${port}/graphql`);
}
bootstrap();

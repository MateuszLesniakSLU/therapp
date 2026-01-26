import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap function - uruchamia aplikację NestJS.
 * Konfiguruje CORS dla frontendu i nasłuchuje na porcie 3000.
 */
async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: 'http://localhost:5173',
        credentials: true,
    })

    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.listen(3000);
}
bootstrap();

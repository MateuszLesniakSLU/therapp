import { NestFactory } from '@nestjs/core';
import { AppModule } from'./app.module';
import {UsersService} from "./users/users.service";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const usersService = app.get(UsersService);

    const users = await usersService.findAllUsers();
    console.log('Users in DB:', users);

    await app.listen(3000);
    console.log('NestJS is running on http://localhost:3000');
}
bootstrap();
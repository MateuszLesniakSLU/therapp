import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
    //imports - jakich modułów użyje?
    imports: [
        //UsersModule - obsługa danych użytkowników
        UsersModule,
        //PassportModule - obsługa logowania
        PassportModule,
        //JwtModule - generowanie tokenów
        JwtModule.register({
            secret: 'SUPER_SECRET_KEY',
            signOptions: { expiresIn: '1h' },
        }),
    ],
    //providers - co chcę zrobić albo co chcemy żeby obsługiwał?
    providers: [ AuthService, LocalStrategy, JwtStrategy ],
    //controllers - jakie endpointy obsługuję? np /login /register
    controllers: [ AuthController ],
    //exports - czy chcę przekazać providery dalej?
})
export class AuthModule {}
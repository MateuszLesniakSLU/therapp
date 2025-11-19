import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        //super - wywołanie konstruktora klasy nadrzędnej
        super();
    }

    //walidacja danych użytkownika, jeżeli niezgodne wyrzuć błąd
    async validate(username: string, password: string): Promise<any> {
        const user = await this.authService.validateUser(username, password);
        if (!user) {
            throw new UnauthorizedException();
        }
        //Passport zapisuje user w request.user
        return user;
    }
}

/*
Jeżeli chcę zmienić dane wysyłane przez super zamiast username i password (domyślne):
super({ usernameField: 'email', passwordField: 'pass' });
passport będzie oczekiwał:
{
  "email": "test@example.com",
  "pass": "123456"
}
 */
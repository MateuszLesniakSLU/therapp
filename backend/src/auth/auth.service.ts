import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

//Injectable - można wstrzyknąć do innych modułów/serwisów
//Service - odpowiada za logikę biznesową np. weryfikowanie loginu, generowanie tokenów, łączenie się z bazą.
@Injectable()
export class AuthService {
    //constructor - wstrzykiwanie np. usersService żeby AuthService mógł korzystać z db i jwtService żeby mógł generować tokeny
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    //weryfikacja danych użytkownika, nieprawidłowe == brak dostępu.
    async validateUser(username: string, password: string) {
        const user = await this.usersService.findUserByUsername(username);

        const isMatch = user && await bcrypt.compare(password, user.password);

        if(isMatch) {
            const { password, ...result } = user;
            return result;
        }
        throw new UnauthorizedException('Nieprawidłowe dane logowania');
    }

    //logowanie do systemu, pomyślnie == zwraca token dostępu przez jwtService
    async login(user:any) {
        //payload - dane wysyłane do jwtService
        const payload = { username: user.username, sub: user.id };
        return {
            accessToken: await this.jwtService.sign(payload),
        }
    }
}
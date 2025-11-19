import {Body, Controller, Post, Request, UseGuards} from '@nestjs/common';
import { AuthService } from './auth.service';
import {UsersService} from "../users/users.service";
import * as bcrypt from 'bcrypt';
import { LocalAuthGuard } from './local-auth.guard';

//Controller odpowiada na zapytania HTTP, 'auth' to prefix dla tego kontrolera np /auth/login itd.
@Controller('auth')
export class AuthController {
    //constructor - wstrzykiwanie authService żeby endpointy mogły korzystać z danych autentykacji
    constructor(
        private authService: AuthService,
        private readonly usersService: UsersService,
        ) {}


    //POST /auth/login poprawne logowanie == zwrócenie tokenu JWT
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req : any) {
        //Passport wstawi user w req.user
        return this.authService.login(req.user);
    }

    //POST /auth/register rejestracja użytkownika
    @Post('register')
    //Body - dane z requestu JSON mają być przekazane do zmiennej body
    async register(@Body() body: {username: string, password: string, email?: string}) {
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const user = await this.usersService.createUser(
            body.username,
            hashedPassword,
            body.email,
        );
        const { password, ...result } = user;
        return { message: 'User created', user: result };
    }
}
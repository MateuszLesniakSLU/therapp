import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
//JwtStrategy jest odpowiedzialny za sprawdzenie tokena w nagłówku Authorization: Bearer <token>
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'SUPER_SECRET_KEY',
        });
    }

    //zwrócenie payload do request.user
    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username };
    }
}
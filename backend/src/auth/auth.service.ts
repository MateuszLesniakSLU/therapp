import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly jwtService: JwtService) {}

  // validateUser używane w LocalStrategy
  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    // zwracamy bez hasła (auth flow używa user w req.user)
    const { password: _p, ...rest } = user;
    return rest;
  }

  // generowanie tokena
  async login(user: any) {
    // user powinien zawierać id i role (np. z db)
    const payload = { username: user.username, sub: user.id ?? user.userId, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}

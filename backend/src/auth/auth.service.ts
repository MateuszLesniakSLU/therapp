import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
     private readonly jwtService: JwtService
    ) {}

  // validateUser używane w LocalStrategy
  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    // zwracamy bez hasła (auth flow używa user w req.user)
    const { password: _, ...result } = user;
    return result;
  }

  // generowanie tokena
  async login(user: any) {
    // user powinien zawierać id i role (np. z db)
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };
    return { 
      access_token: this.jwtService.sign(payload),
    };
  }
}

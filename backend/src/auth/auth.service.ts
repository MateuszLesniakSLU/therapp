import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logsService: ActivityLogsService
  ) { }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      // We can't log easily here without user ID, maybe log by IP in controller/interceptor?
      // Or leave it for generic error logging
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.logsService.createLog(user.id, 'LOGIN_FAILED', { reason: 'Account inactive' }, undefined, 'WARN');
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      await this.logsService.createLog(user.id, 'LOGIN_FAILED', { reason: 'Invalid password' }, undefined, 'WARN');
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    await this.logsService.createLog(user.id, 'LOGIN_SUCCESS', undefined, undefined, 'INFO');

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      userId: user.id // Ensure userId is present in token for consistency
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }
}

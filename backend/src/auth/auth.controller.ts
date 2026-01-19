import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Rejestracja nowego użytkownika.
   * Endpoint publiczny (nie wymaga logowania).
   */
  @Public()
  @Post('register')
  async register(@Body() body: { email: string; password: string; firstName?: string; lastName?: string; role?: string }) {
    return this.authService.register(body.email, body.password, body.firstName, body.lastName, body.role);
  }

  /**
   * Logowanie użytkownika.
   * Używa LocalAuthGuard, który sprawdza email i hasło (w auth.service.validateUser).
   * Jeśli dane są poprawne, zwraca token JWT.
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  /**
   * Weryfikacja adresu email po kliknięciu w link aktywacyjny.
   */
  @Public()
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /**
   * Prośba o reset hasła (wysyła email z linkiem).
   */
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  /**
   * Ustawienie nowego hasła przy użyciu tokenu otrzymanego w mailu.
   */
  @Public()
  @Post('reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() body: { password: string }
  ) {
    return this.authService.resetPassword(token, body.password);
  }
}

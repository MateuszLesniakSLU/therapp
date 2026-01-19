import { Injectable, UnauthorizedException, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Serwis odpowiedzialny za logikę uwierzytelniania.
 * Obsługuje logowanie, rejestrację, resetowanie hasła i weryfikację e-maila.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logsService: ActivityLogsService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService
  ) { }

  /**
   * Sprawdza, czy podany e-mail i hasło są poprawne.
   * Weryfikuje również czy konto jest aktywne i zweryfikowane.
   * Używane przez LocalStrategy przy próbie logowania.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Nieprawidłowe dane logowania');
    }

    if (!user.isActive) {
      await this.logsService.createLog(user.id, 'LOGIN_FAILED', { reason: 'Account inactive' }, undefined, 'WARN');
      throw new UnauthorizedException('Konto jest nieaktywne');
    }

    if (!user.isVerified) {
      await this.logsService.createLog(user.id, 'LOGIN_FAILED', { reason: 'Email not verified' }, undefined, 'WARN');
      throw new UnauthorizedException('Proszę zweryfikować adres email');
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      await this.logsService.createLog(user.id, 'LOGIN_FAILED', { reason: 'Invalid password' }, undefined, 'WARN');
      throw new UnauthorizedException('Nieprawidłowe dane logowania');
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Generuje token JWT po udanej walidacji użytkownika.
   * Token zawiera ID, email i rolę użytkownika.
   */
  async login(user: any) {
    await this.logsService.createLog(user.id, 'LOGIN_SUCCESS', undefined, undefined, 'INFO');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      userId: user.id
    };

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }

  /**
   * Rejestruje nowego użytkownika, hashuje hasło i wysyła link weryfikacyjny.
   * Sprawdza czy email jest unikalny.
   */
  async register(email: string, password: string, firstName?: string, lastName?: string, role: string = 'patient') {
    const exists = await this.usersService.findByEmail(email);
    if (exists) {
      throw new ConflictException('Email jest już zarejestrowany');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        isVerified: false,
        verificationToken,
        verificationTokenExpires,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Rejestracja zakończona sukcesem. Sprawdź swój email aby zweryfikować konto.' };
  }

  /**
   * Weryfikuje adres email użytkownika na podstawie tokenu.
   * Aktywuje konto po pomyślnej weryfikacji.
   */
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Nieprawidłowy lub wygasły token weryfikacyjny');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    await this.logsService.createLog(user.id, 'EMAIL_VERIFIED', undefined, undefined, 'INFO');

    return { message: 'Email zweryfikowany sukcesem. Możesz teraz zalogować się.' };
  }

  /**
   * Inicjuje proces resetowania hasła, generując token i wysyłając email.
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'Jeśli konto z tą adresem email istnieje, link do resetowania hasła został wysłany.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordTokenExpires: resetTokenExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(email, resetToken);
    await this.logsService.createLog(user.id, 'PASSWORD_RESET_REQUESTED', undefined, undefined, 'INFO');

    return { message: 'Jeśli konto z tym adresem email istnieje, link do resetowania hasła został wysłany.' };
  }

  /**
   * Ustawia nowe hasło dla użytkownika na podstawie ważnego tokenu resetującego.
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Nieprawidłowy lub wygasły token resetujący.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null,
      },
    });

    await this.logsService.createLog(user.id, 'PASSWORD_RESET_SUCCESS', undefined, undefined, 'INFO');

    return { message: 'Hasło zostało zresetowane. Możesz teraz zalogować się z nowym hasłem.' };
  }
}

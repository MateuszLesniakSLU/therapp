import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

/**
 * Kontroler obsługujący użytkowników.
 * Większość endpointów jest zabezpieczona (wymaga logowania i odpowiedniej roli).
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * Pobiera listę użytkowników.
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAllUsers();
  }

  /**
   * Pobiera dane AKTUALNIE zalogowanego użytkownika ("Mój profil").
   * ID użytkownika jest pobierane z tokenu JWT.
   */
  @Get('me')
  @Roles(Role.PATIENT, Role.ADMIN, Role.THERAPIST)
  async getMe(@Request() req: any) {
    const rawId = req?.user?.userId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Nieprawidłowe ID użytkownika w tokenie');
    return this.usersService.findUserById(id);
  }

  /**
   * Aktualizacja własnego profilu.
   */
  @Patch('me')
  @Roles(Role.PATIENT, Role.ADMIN, Role.THERAPIST)
  async updateMe(@Request() req: any, @Body() body: UpdateUserDto) {
    const rawId = req?.user?.userId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Nieprawidłowe ID użytkownika w tokenie');
    return this.usersService.updateUser(id, body);
  }


  /**
   * Pobranie dowolnego użytkownika po ID.
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserById(id);
  }

  /**
   * Stworzenie nowego użytkownika ręcznie.
   */
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.email, dto.password, dto.role);
  }

  /**
   * Edycja dowolnego użytkownika.
   */
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  /**
   * Zmiana własnego hasła.
   */
  @Patch('me/password')
  @Roles(Role.PATIENT, Role.ADMIN, Role.THERAPIST)
  async changeMyPassword(
    @Request() req: any,
    @Body() dto: ChangePasswordDto,
  ) {
    const id = Number(req.user.userId)
    return this.usersService.changePassword(
      id,
      dto.currentPassword,
      dto.newPassword,
    )
  }


  /**
   * Zmiana hasła innemu użytkownikowi (reset).
   */
  @Patch(':id/password')
  @Roles(Role.ADMIN)
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  /**
   * Dezaktywacja konta użytkownika.
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.softDeleteUser(id);
  }

  /**
   * Przywrócenie konta użytkownika.
   */
  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.restoreUser(id);
  }

  /**
   * Pobranie statystyk dla admina.
   */
  @Get('stats/dashboard')
  @Roles(Role.ADMIN)
  getStats() {
    return this.usersService.getAdminStats();
  }
}

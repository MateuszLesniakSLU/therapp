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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * GET /users
   * Dostęp: ADMIN
   * Zwraca tylko aktywnych użytkowników
   */
  @Get()
  @Roles('admin')
  findAll() {
    return this.usersService.findAllUsers();
  }

  // GET /users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Roles('patient', 'admin', 'therapist')
  async getMe(@Request() req: any) {
    const rawId = req?.user?.userId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid user id in token');
    return this.usersService.findUserById(id);
  }

  // PATCH /users/me (update own profile)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @Roles('patient', 'admin', 'therapist')
  async updateMe(@Request() req: any, @Body() body: UpdateUserDto) {
    const rawId = req?.user?.userId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid user id in token');
    return this.usersService.updateUser(id, body);
  }


  /**
   * GET /users/:id
   * Dostęp: ADMIN
   */
  @Get(':id')
  @Roles('admin')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserById(id);
  }

  /**
   * POST /users
   * Dostęp: ADMIN
   * Tworzenie nowego użytkownika
   */
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto.username, dto.password, dto.role);
  }

  /**
   * PATCH /users/:id
   * Dostęp: ADMIN
   * Aktualizacja danych użytkownika
   */
  @Patch(':id')
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  /**
   * PATCH /users/me/password
   * Dostęp: USER + ADMIN + THERAPIST
   * Zmiana własnego hasła
   */
  @Patch('me/password')
  @Roles('patient', 'admin', 'therapist')
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
   * PATCH /users/:id/password
   * Dostęp: ADMIN
   * Zmiana hasła użytkownika
   */
  @Patch(':id/password')
  @Roles('admin')
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
   * DELETE /users/:id
   * Dostęp: ADMIN
   * SOFT DELETE — dezaktywacja użytkownika
   */
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.softDeleteUser(id);
  }

  /**
   * PATCH /users/:id/restore
   * Dostęp: ADMIN
   * Przywracanie dezaktywowanego użytkownika
   */
  @Patch(':id/restore')
  @Roles('admin')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.restoreUser(id);
  }

  @Get('stats/dashboard')
  @Roles('admin')
  getStats() {
    return this.usersService.getAdminStats();
  }
}

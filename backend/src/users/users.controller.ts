import { Controller, Get, Patch, Param, Body, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users (admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAllUsers();
  }

  // GET /users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    const rawId = req?.user?.userId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid user id in token');
    return this.usersService.findUserById(id);
  }

  // PATCH /users/me (update own profile)
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Request() req: any, @Body() body: UpdateUserDto) {
    const rawId = req?.user?.userId;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid user id in token');
    return this.usersService.updateUser(id, body);
  }
  
  // GET /users/:id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw new BadRequestException('Invalid id');
    return this.usersService.findUserById(idNum);
  }

  // PATCH /users/:id (update user) - self or admin could be enforced later
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw new BadRequestException('Invalid id');
    return this.usersService.updateUser(idNum, body);
  }

  // DELETE /users/:id (soft delete) - admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  softDelete(@Param('id') id: string) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw new BadRequestException('Invalid id');
    return this.usersService.softDeleteUser(idNum);
  }

  // PATCH /users/:id/restore (admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw new BadRequestException('Invalid id');
    return this.usersService.restoreUser(idNum);
  }
}

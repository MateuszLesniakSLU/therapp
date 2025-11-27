import { Controller, Get, Param, Patch, Body, Delete } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // GET /users
    @Get()
    async findAll() {
        return await this.usersService.findAllUsers();
    }

// GET /users/:id
    @Get(':id')
    async findOne(@Param('id') id: number) {
        return this.usersService.findUserById(id);
    }

// PATCH /users/:id
    @Patch(':id')
    async update(
        @Param('id') id: number,
        @Body() body: { username?: string; email?: string }
    ) {
        return this.usersService.updateUser(id, body);
    }

// DELETE /users/:id

    @Delete(':id')
    async remove(@Param('id') id: number) {
        return this.usersService.softDeleteUser(id);
    }
}


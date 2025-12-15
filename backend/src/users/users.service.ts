import {Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });
  }

  async findUserById(id: number) {
    const user =  await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    } 
    else if (!user.isActive) {
      throw new BadRequestException('User is deactivated');
    }

    return user;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async createUser(username: string, password: string, role: string) {
    const exists = await this.prisma.user.findUnique({
      where: { username },
    });

    if (exists) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });
  }

  async updateUser(
  id: number,
  data: {
    username?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  },
) {
  try {
    return await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        first_name: true,
        last_name: true,
        isActive: true,
      },
    });
  } catch {
    throw new NotFoundException('User not found');
  }
}


  async changePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async softDeleteUser(id: number) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          deletedAt: new Date(),
         },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
        },
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }

  async restoreUser(id: number) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
        },
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}

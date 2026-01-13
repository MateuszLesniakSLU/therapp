import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Pobiera wszystkich użytkowników.
   */
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

  /**
   * Pobiera pojedynczego użytkownika po ID.
   * @param id ID użytkownika
   * @throws NotFoundException jeśli użytkownik nie zostanie znaleziony
   * @throws BadRequestException jeśli użytkownik jest nieaktywny
   */
  async findUserById(id: number) {
    const user = await this.prisma.user.findUnique({
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
    if (!user.isActive) {
      throw new BadRequestException('User is deactivated');
    }

    return user;
  }

  /**
   * Pobiera użytkownika po nazwie użytkownika.
   * @param username Nazwa użytkownika
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Tworzy nowego użytkownika.
   * @param username Nazwa użytkownika
   * @param password Hasło
   * @param role Rola
   * @throws ConflictException jeśli nazwa użytkownika już istnieje
   */
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

  /**
   * Aktualizuje dane użytkownika.
   * @param id ID użytkownika
   * @param data Dane do aktualizacji
   * @throws NotFoundException jeśli użytkownik nie zostanie znaleziony (poprzez Prisma P2025)
   */
  async updateUser(
    id: number,
    data: {
      username?: string;
      role?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    },
  ) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.username && { username: data.username }),
          ...(data.role && { role: data.role }),
          ...(data.firstName && { first_name: data.firstName }),
          ...(data.lastName && { last_name: data.lastName }),
          ...(data.email && { email: data.email }),
        },
        select: {
          id: true,
          username: true,
          role: true,
          first_name: true,
          last_name: true,
          email: true,
          isActive: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  /**
   * Zmienia hasło użytkownika.
   * @param id ID użytkownika
   * @param oldPassword Stare hasło
   * @param newPassword Nowe hasło
   * @throws NotFoundException jeśli użytkownik nie zostanie znaleziony
   * @throws BadRequestException jeśli stare hasło jest nieprawidłowe
   */
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

  /**
   * Usuwa użytkownika (soft delete, ustawia isActive = false).
   * @param id ID użytkownika
   * @throws NotFoundException jeśli użytkownik nie zostanie znaleziony
   */
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
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  /**
   * Przywraca usuniętego użytkownika (ustawia isActive = true).
   * @param id ID użytkownika
   * @throws NotFoundException jeśli użytkownik nie zostanie znaleziony
   */
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
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async getAdminStats() {
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.user.count({ where: { isActive: true } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await this.prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } }
    });

    const roles = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      roles
    };
  }
}

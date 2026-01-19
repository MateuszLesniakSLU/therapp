import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Serwis zarządzający użytkownikami.
 * Odpowiada za operacje na bazie danych (CRUD) dotyczące tabeli User.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Pobiera wszystkich użytkowników z bazy.
   */
  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  /**
   * Szuka jednego użytkownika na podstawie ID.
   * Sprawdza czy użytkownik istnieje oraz czy jest aktywny.
   */
  async findUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Użytkownik nie znaleziony');
    }

    if (!user.isActive) {
      throw new BadRequestException('Użytkownik jest nieaktywny');
    }

    return user;
  }

  /**
   * Pomocnicza metoda szukająca po e-mailu.
   * Wykorzystywana głównie przy logowaniu.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Tworzy nowego użytkownika (np. przez administratora).
   * Sprawdza unikalność maila i hashuje hasło.
   */
  async createUser(email: string, password: string, role: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      throw new ConflictException('Email jest już zajęty');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  /**
   * Aktualizuje wybrane pola użytkownika.
   * Obsługuje elastyczne DTO oraz normalizację pól imienia i nazwiska.
   */
  async updateUser(
    id: number,
    data: {
      role?: string;
      firstName?: string;
      lastName?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
    },
  ) {
    try {
      const firstName = data.firstName || data.first_name;
      const lastName = data.lastName || data.last_name;

      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(data.role && { role: data.role }),
          ...(firstName && { first_name: firstName }),
          ...(lastName && { last_name: lastName }),
          ...(data.email && { email: data.email }),
        },
        select: {
          id: true,
          email: true,
          role: true,
          first_name: true,
          last_name: true,
          isActive: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Użytkownik nie znaleziony');
      }
      throw error;
    }
  }

  /**
   * Zmiana hasła przez użytkownika.
   * Wymaga podania i weryfikacji starego hasła.
   */
  async changePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Użytkownik nie znaleziony');
    }

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Stare hasło jest nieprawidłowe');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * "Soft delete" - nie usuwa rekordu fizycznie, tylko oznacza jako nieaktywny.
   * Pozwala to na zachowanie historii danych.
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
          email: true,
          role: true,
          isActive: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Użytkownik nie znaleziony');
      }
      throw error;
    }
  }

  /**
   * Przywraca usuniętego użytkownika (ustawia flagę active na true).
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
          email: true,
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
   * Generuje statystyki użytkowników dla panelu administratora.
   */
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

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConnectionsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Generuje 6-cyfrowy kod dla pacjenta.
     * Kod jest ważny np. przez 24h.
     */
    async generateCode(userId: number) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 5);

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                connectionCode: code,
                connectionCodeExpires: expires,
            },
        });

        return { code, expires };
    }

    /**
     * Terapeuta wysyła prośbę o połączenie, podając kod pacjenta.
     */
    async requestConnection(therapistId: number, code: string) {
        // Znajdź pacjenta z tym kodem
        const patient = await this.prisma.user.findFirst({
            where: {
                connectionCode: code,
                connectionCodeExpires: { gt: new Date() },
            },
        });

        if (!patient) {
            throw new NotFoundException('Nieprawidłowy lub wygasły kod.');
        }

        if (patient.role !== 'patient') {
            throw new BadRequestException('Ten kod nie należy do pacjenta.');
        }

        // Sprawdź czy już nie są połączeni
        const existing = await this.prisma.patientTherapist.findUnique({
            where: {
                patientId_therapistId: {
                    patientId: patient.id,
                    therapistId: therapistId,
                },
            },
        });

        if (existing) {
            if (existing.status === 'ACTIVE') throw new BadRequestException('Już jesteś połączony z tym pacjentem.');
            if (existing.status === 'PENDING') throw new BadRequestException('Prośba o połączenie już wysłana.');
        }

        // Utwórz połączenie (PENDING)
        return this.prisma.patientTherapist.create({
            data: {
                patientId: patient.id,
                therapistId: therapistId,
                status: 'PENDING',
            },
        });
    }

    /**
     * Pobiera połączenia dla danego użytkownika.
     */
    async getMyConnections(userId: number, role: string) {
        if (role === 'patient') {
            return this.prisma.patientTherapist.findMany({
                where: { patientId: userId },
                include: {
                    therapist: {
                        select: { id: true, first_name: true, last_name: true, email: true, username: true },
                    },
                },
            });
        } else {
            return this.prisma.patientTherapist.findMany({
                where: { therapistId: userId },
                include: {
                    patient: {
                        select: { id: true, first_name: true, last_name: true, email: true, username: true },
                    },
                },
            });
        }
    }

    /**
     * Odpowiedź na prośbę (ACCEPT / REJECT / DELETE).
     */
    async respondToRequest(userId: number, connectionId: number, action: 'ACCEPT' | 'REJECT' | 'DELETE') {
        const connection = await this.prisma.patientTherapist.findUnique({
            where: { id: connectionId },
        });

        if (!connection) throw new NotFoundException('Połączenie nie znalezione.');

        // Sprawdzenie uprawnień (czy user jest stroną połączenia)
        if (connection.patientId !== userId && connection.therapistId !== userId) {
            throw new BadRequestException('Brak dostępu.');
        }

        if (action === 'DELETE' || action === 'REJECT') {
            return this.prisma.patientTherapist.delete({
                where: { id: connectionId },
            });
        }

        if (action === 'ACCEPT') {
            // Tylko pacjent akceptuje (w tym flow, bo to terapeuta prosił)
            // Ale w sumie flow jest: Patient daje kod -> Terapeuta wpisuje -> Powstaje PENDING -> Patient akceptuje w "Moi doktorzy"
            if (connection.patientId !== userId) throw new BadRequestException('Tylko pacjent może zaakceptować zaproszenie.');

            return this.prisma.patientTherapist.update({
                where: { id: connectionId },
                data: { status: 'ACTIVE' },
            });
        }
    }
}

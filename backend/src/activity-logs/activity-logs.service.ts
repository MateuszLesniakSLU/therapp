import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogsService {
    constructor(private readonly prisma: PrismaService) { }

    async createLog(userId: number, action: string, details?: any, ipAddress?: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
        return this.prisma.activityLog.create({
            data: {
                userId,
                action,
                details: details ? JSON.parse(JSON.stringify(details)) : undefined,
                ipAddress,
                level,
            },
        });
    }

    async getLogs(userId: number, limit = 50, offset = 0) {
        const [auditLogs, total] = await Promise.all([
            this.prisma.activityLog.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.activityLog.count({ where: { userId } }),
        ]);

        return {
            logs: auditLogs,
            total,
        };
    }
}

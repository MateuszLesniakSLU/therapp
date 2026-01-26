import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogsController {
    constructor(private readonly logsService: ActivityLogsService) { }

    @Get('user/:userId')
    @Roles(Role.ADMIN)
    async getUserLogs(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('limit') limit = '50',
        @Query('offset') offset = '0',
    ) {
        return this.logsService.getLogs(userId, parseInt(limit), parseInt(offset));
    }
}

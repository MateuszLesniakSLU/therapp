import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Patch } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('connections')
@UseGuards(JwtAuthGuard)
export class ConnectionsController {
    constructor(private readonly connectionsService: ConnectionsService) { }

    @Post('generate-code')
    async generateCode(@Request() req: any) {
        return this.connectionsService.generateCode(req.user.userId);
    }

    @Post('request')
    async requestConnection(@Request() req: any, @Body('code') code: string) {
        return this.connectionsService.requestConnection(req.user.userId, code);
    }

    @Get()
    async getMyConnections(@Request() req: any) {
        return this.connectionsService.getMyConnections(req.user.userId, req.user.role);
    }

    @Patch(':id/accept')
    async acceptRequest(@Request() req: any, @Param('id') id: string) {
        return this.connectionsService.respondToRequest(req.user.userId, parseInt(id), 'ACCEPT');
    }

    @Delete(':id')
    async deleteConnection(@Request() req: any, @Param('id') id: string) {
        return this.connectionsService.respondToRequest(req.user.userId, parseInt(id), 'DELETE');
    }
}

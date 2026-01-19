import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { SurveysModule } from './surveys/surveys.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConnectionsModule } from './connections/connections.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { ContactModule } from './contact/contact.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    SurveysModule,
    PrismaModule,
    ConnectionsModule,
    ActivityLogsModule,
    ContactModule
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }

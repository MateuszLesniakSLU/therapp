import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { DatabaseModule } from '../database/database.module';
import { SurveySchedulerService } from './survey-scheduler.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SurveysController],
  providers: [SurveysService, SurveySchedulerService],
  exports: [SurveysService],
})
export class SurveysModule {}

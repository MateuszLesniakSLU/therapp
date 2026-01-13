import { Module } from '@nestjs/common';
import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';
import { SurveySchedulerService } from './survey-scheduler.service';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [ActivityLogsModule],
  controllers: [SurveysController],
  providers: [SurveysService, SurveySchedulerService],
  exports: [SurveysService],
})
export class SurveysModule { }

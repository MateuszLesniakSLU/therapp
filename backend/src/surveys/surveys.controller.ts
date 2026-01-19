import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitResponseDto, AnswerDto } from './dto/submit-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Controller('surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly logsService: ActivityLogsService
  ) { }


  /*
   * POST /surveys
   * Tworzy nową ankietę.
   */
  @Roles('admin', 'therapist')
  @Post()
  async createSurvey(
    @Request() req: any,
    @Body() createSurveyDto: CreateSurveyDto,
  ) {
    const userId = req.user.sub || req.user.userId
    return this.surveysService.createSurvey(userId, createSurveyDto)
  }

  /**
   * GET /surveys
   * Pobiera listę aktywnych ankiet.
   */
  @Roles('patient', 'admin', 'therapist')
  @Get()
  async listSurveys() {
    return this.surveysService.listSurveys()
  }

  /**
   * GET /surveys/my/status
   * Pobiera status ankiet wypełnionych przez zalogowanego pacjenta.
   */
  @Roles('patient')
  @Get('my/status')
  async getMySurveyStatus(@Request() req: any) {
    const userId = req.user.sub || req.user.userId
    return this.surveysService.getMySurveyStatus(userId)
  }

  @Roles('patient')
  @Get('my/response/:surveyId')
  async getMyResponse(
    @Request() req: any,
    @Param('surveyId', ParseIntPipe) surveyId: number
  ) {
    const userId = req.user.sub || req.user.userId
    return this.surveysService.getMyResponse(userId, surveyId)
  }


  /*
   * GET /surveys/my-patients
   * Pobiera listę pacjentów przypisanych do terapeuty.
   */
  @Get('my-patients')
  @Roles('therapist')
  async getMyPatients(@Request() req: any) {
    await this.logsService.createLog(
      req.user.userId,
      'VIEW_PATIENTS',
      undefined,
      req.ip
    );
    return this.surveysService.getTherapistPatients(req.user.userId);
  }

  @Get('dashboard-stats')
  @Roles('therapist')
  async getDashboardStats(@Request() req: any) {
    return this.surveysService.getTherapistDashboardStats(req.user.userId);
  }

  @Get('therapist/stats/:patientId')
  @Roles('therapist')
  async getPatientStats(
    @Param('patientId') patientId: string,
    @Query('days') days: string
  ) {
    return this.surveysService.getPatientStats(
      parseInt(patientId),
      parseInt(days || '30')
    );
  }

  /**
   * GET /surveys/:id
   * Pobiera szczegóły ankiety.
   */
  @Roles('patient', 'admin', 'therapist')
  @Get(':id')
  async getSurveyById(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getSurvey(id)
  }

  /*
   * PATCH /surveys/:id
   * Aktualizuje ankietę.
   */
  @Roles('admin', 'therapist')
  @Patch(':id')
  async updateSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSurveyDto: UpdateSurveyDto,
  ) {
    return this.surveysService.updateSurvey(id, updateSurveyDto)
  }

  /**
   * POST /surveys/today/response
   * Zapisuje odpowiedź na ankietę.
   */
  @Roles('patient', 'admin', 'therapist')
  @Post('today/response')
  saveResponse(
    @Request() req: any,
    @Body() submitResponseDto: SubmitResponseDto,
  ) {
    const userId = req.user.sub || req.user.userId
    return this.surveysService.saveTodayResponse(userId, submitResponseDto)
  }

  /**
   * GET /surveys/:id/responses
   * Pobiera listę odpowiedzi dla danej ankiety.
   */
  @Roles('admin', 'therapist')
  @Get(':id/responses')
  async listResponses(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.listResponses(id)
  }

  /**
   * GET /surveys/:id/stats
   * Pobiera statystyki dla danej ankiety.
   */
  @Roles('therapist', 'admin')
  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getStats(id)
  }

  /*
   * POST /surveys/assign
   * Przypisuje ankietę do pacjentów.
   */
  @Post('assign')
  @Roles('therapist')
  async assignSurvey(@Body() body: { surveyId: number; patientIds: number[] }, @Request() req: any) {
    const result = await this.surveysService.assignSurvey(body.surveyId, body.patientIds, req.user.userId);
    await this.logsService.createLog(
      req.user.userId,
      'SURVEY_ASSIGNED',
      { surveyId: body.surveyId, patientCount: body.patientIds.length },
      req.ip
    );
    return result;
  }
}

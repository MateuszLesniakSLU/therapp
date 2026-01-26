import {
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
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
import { Role } from '../auth/role.enum';
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
  @Roles(Role.ADMIN, Role.THERAPIST)
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
   * Pobiera listę aktywnych ankiet (dla pacjenta tylko przypisane).
   */
  @Roles(Role.PATIENT, Role.ADMIN, Role.THERAPIST)
  @Get()
  async listSurveys(@Request() req: any) {
    const userId = req.user.sub || req.user.userId;
    const role = req.user.role;
    return this.surveysService.listSurveys(userId, role);
  }

  /**
   * GET /surveys/my/status
   * Pobiera status ankiet wypełnionych przez zalogowanego pacjenta.
   */
  @Roles(Role.PATIENT)
  @Get('my/status')
  async getMySurveyStatus(@Request() req: any) {
    const userId = req.user.sub || req.user.userId
    return this.surveysService.getMySurveyStatus(userId)
  }

  @Roles(Role.PATIENT)
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
  @Roles(Role.THERAPIST)
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
  @Roles(Role.THERAPIST)
  async getDashboardStats(@Request() req: any) {
    return this.surveysService.getTherapistDashboardStats(req.user.userId);
  }

  @Roles(Role.THERAPIST, Role.ADMIN)
  @Get('all')
  async listAllSurveys() {
    return this.surveysService.listAllSurveys();
  }

  @Get('therapist/stats/:patientId')
  @Roles(Role.THERAPIST)
  async getPatientStats(
    @Request() req: any,
    @Param('patientId') patientId: string,
    @Query('days') days: string
  ) {
    return this.surveysService.getPatientStats(
      req.user.userId,
      parseInt(patientId),
      parseInt(days || '30')
    );
  }

  /**
   * GET /surveys/:id/details
   * Pobiera szczegóły ankiety dla terapeuty.
   */
  @Roles(Role.THERAPIST, Role.ADMIN)
  @Get(':id/details')
  async getSurveyDetails(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getSurveyDetailsForTherapist(id);
  }

  /**
   * PUT /surveys/:id/assignments
   * Aktualizuje przypisania ankiety (dodawanie/usuwanie pacjentów).
   */
  @Roles(Role.THERAPIST, Role.ADMIN)
  @Put(':id/assignments')
  async updateAssignments(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { patientIds: number[] }
  ) {
    return this.surveysService.updateSurveyAssignments(id, body.patientIds);
  }

  /**
   * DELETE /surveys/:id
   * Usuwa (dezaktywuje) ankietę.
   */
  @Roles(Role.THERAPIST, Role.ADMIN)
  @Delete(':id')
  async deleteSurvey(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.deleteSurvey(id);
  }

  /**
   * PATCH /surveys/:id/status
   * Zmienia status aktywności ankiety.
   */
  @Roles(Role.THERAPIST, Role.ADMIN)
  @Patch(':id/status')
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('active') active: boolean
  ) {
    return this.surveysService.setSurveyStatus(id, active);
  }

  /**
   * GET /surveys/:id
   * Pobiera szczegóły ankiety.
   */
  @Roles(Role.PATIENT, Role.ADMIN, Role.THERAPIST)
  @Get(':id')
  async getSurveyById(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getSurvey(id)
  }

  /*
   * PATCH /surveys/:id
   * Aktualizuje ankietę.
   */
  @Roles(Role.ADMIN, Role.THERAPIST)
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
  @Roles(Role.PATIENT, Role.ADMIN, Role.THERAPIST)
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
  @Roles(Role.ADMIN, Role.THERAPIST)
  @Get(':id/responses')
  async listResponses(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.listResponses(id)
  }

  /**
   * GET /surveys/:id/stats
   * Pobiera statystyki dla danej ankiety.
   */
  @Roles(Role.THERAPIST, Role.ADMIN)
  @Get(':id/stats')
  async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getStats(id)
  }

  /*
   * POST /surveys/assign
   * Przypisuje ankietę do pacjentów.
   */
  @Post('assign')
  @Roles(Role.THERAPIST)
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

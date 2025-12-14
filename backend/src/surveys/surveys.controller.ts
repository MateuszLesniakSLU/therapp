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
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { AssignSurveyDto } from './dto/assign-survey.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('surveys')
export class SurveysController {
    constructor(private readonly surveysService: SurveysService) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'therapist')
    @Post()
    async createSurvey(@Request() req: any, @Body() createSurveyDto: CreateSurveyDto) {
        const userId = req.user.sub || req.user.userId;
        return this.surveysService.createSurvey(userId, createSurveyDto);
    }

    @Get()
    async listSurveys() {
        return this.surveysService.listSurveys();
    }

    @Get(':id')
    async getSurveyById(@Param('id', ParseIntPipe) id: number) {
        return this.surveysService.getSurvey(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'therapist')
    @Patch(':id')
    async updateSurvey(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSurveyDto: UpdateSurveyDto,
    ) {
        return this.surveysService.updateSurvey(id, updateSurveyDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'therapist')
    @Post(':id/active')
    async setActive(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { active: boolean },
    ) {
        return this.surveysService.setActive(id, Boolean(body.active));
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/submit')
    async submitResponse(
        @Request() req: any,
        @Param('id', ParseIntPipe) id: number,
        @Body() submitResponseDto: SubmitResponseDto,
    ) {
        const userId = req.user.sub || req.user.userId;
        return this.surveysService.submitResponse(userId, id, submitResponseDto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'therapist')
    @Get(':id/responses')
    async listResponses(@Param('id', ParseIntPipe) id: number) {
        return this.surveysService.listResponses(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('doctor', 'admin')
    @Get(':id/stats')
    async getStats(@Param('id', ParseIntPipe) id: number) {
    return this.surveysService.getStats(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'therapist')
    @Post(':id/assign')
    async assignSurveyToUsers(
        @Param('id', ParseIntPipe) id: number,
        @Body() assignSurveyDto: AssignSurveyDto,
    ) {
        return this.surveysService.assignSurveyToUsers(id, assignSurveyDto.user_ids, assignSurveyDto.expires_at);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'therapist')
    @Patch(':id/restore')
    async restoreSurvey(@Param('id', ParseIntPipe) id: number) {
        return this.surveysService.restoreSurvey(id);
    }
}
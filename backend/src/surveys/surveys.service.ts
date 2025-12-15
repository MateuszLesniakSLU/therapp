import { 
  Injectable,
  BadRequestException, 
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitResponseDto, AnswerDto } from './dto/submit-response.dto';

@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) {}

  async createSurvey(createdById: number, dto: CreateSurveyDto)
  {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const surveyDate = new Date(
        now.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' }),
      );
      const survey = await tx.survey.create({
        data: {
          title: dto.title,
          description: dto.description ?? null,
          date: surveyDate,
          createdById,
          active: true,
        },
      });

      if (!dto.questions || dto.questions.length === 0) {
        throw new BadRequestException('Survey must contain at least one question');
      }

      for (let i = 0; i < dto.questions.length; i++) {
        
        const questionDto = dto.questions[i];

        const question = await tx.surveyQuestion.create({
          data: {
            surveyId: survey.id,
            questionText: questionDto.question_text,
            questionType: questionDto.question_type,
            required: questionDto.required,
            order: i,
          },
        });

        if (questionDto.question_type === 'choice' && questionDto.options?.length) {
          for (let j = 0; j < questionDto.options.length; j++) {
            await tx.surveyQuestionOption.create({
              data: {
                questionId: question.id,
                text: questionDto.options[j].option_text,
                order: j,
              },
            });
          }
        }
      }
      return survey;
    });
  }

  async listSurveys(): Promise<any[]> {
    return this.prisma.survey.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSurvey(id: number) {
    const survey = await this.prisma.survey.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: true },
        },
      },
    });

    if (!survey) {
      throw new NotFoundException('Survey not found');
    }

    return survey;
  }

  async saveTodayResponse(userId: number, dto: SubmitResponseDto) {
  const survey = await this.prisma.survey.findFirst({
    where: { active: true },
  });

  if (!survey) {
    throw new ForbiddenException('Survey is closed');
  }

  return this.prisma.surveyResponse.upsert({
    where: {
      surveyId_userId: {
        surveyId: survey.id,
        userId,
      },
    },
    update: {
      tookMedication: dto.took_medication ?? null,
      wellbeingRating: dto.wellbeing_rating ?? null,
    },
    create: {
      surveyId: survey.id,
      userId,
      tookMedication: dto.took_medication ?? null,
      wellbeingRating: dto.wellbeing_rating ?? null,
    },
  });
}


  async updateSurvey(id: number, dto: UpdateSurveyDto) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Survey not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.survey.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
        },
      });

      if (!dto.questions) return;

      await tx.surveyQuestionOption.deleteMany({
        where: { question: { surveyId: id } },
      });
      await tx.surveyQuestion.deleteMany({
        where: { surveyId: id },
      });

      for (let i = 0; i < dto.questions.length; i++) {
        const q = dto.questions[i];

        const question = await tx.surveyQuestion.create({
          data: {
            surveyId: id,
            questionText: q.question_text || '',
            questionType: q.question_type || 'text',
            required: q.required ?? true,
            order: i,
          },
        });

        if (q.question_type === 'choice' && q.options?.length) {
          for (let j = 0; j < q.options.length; j++) {
            await tx.surveyQuestionOption.create({
              data: {
                questionId: question.id,
                text: q.options[j].option_text || '',
                order: j,
              },
            });
          }
        }
      }
    });
  }

async listResponses(surveyId: number) {
  const survey = await this.prisma.survey.findUnique({
    where: { id: surveyId },
  });

  if (!survey) {
    throw new NotFoundException('Survey not found');
  }

  const responses = await this.prisma.surveyResponse.findMany({
    where: { surveyId },
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
      answers: {
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
            },
          },
        },
      },
    },
  });

  return responses;
}

async getStats(surveyId: number) {
  const survey = await this.prisma.survey.findUnique({
    where: { id: surveyId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!survey) {
    throw new NotFoundException('Survey not found');
  }

  const stats = [];

  for (const question of survey.questions) {
    if (question.questionType === 'rating' || question.questionType === 'number') {
      const answers = await this.prisma.surveyAnswer.findMany({
        where: {
          questionId: question.id,
          answerValue: { not: null },
        },
        select: { answerValue: true },
      });

      const values = answers.map((a) => a.answerValue as number);
      const count = values.length;
      const avg =
        count > 0 ? values.reduce((a, b) => a + b, 0) / count : null;

      const distribution: Record<number, number> = {};
      for (const v of values) {
        distribution[v] = (distribution[v] ?? 0) + 1;
      }

      stats.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        count,
        avg,
        distribution,
      });

      continue;
    }

    if (question.questionType === 'choice') {
      const answers = await this.prisma.surveyAnswer.findMany({
        where: {
          questionId: question.id,
          answerText: { not: null },
        },
        select: { answerText: true },
      });

      const counts: Record<string, number> = {};
      for (const a of answers) {
        counts[a.answerText!] = (counts[a.answerText!] ?? 0) + 1;
      }

      stats.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        options: counts,
      });

      continue;
    }

    const textCount = await this.prisma.surveyAnswer.count({
      where: {
        questionId: question.id,
        answerText: { not: null },
      },
    });

    stats.push({
      questionId: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      count: textCount,
    });
  }

  return {
    surveyId: survey.id,
    title: survey.title,
    stats,
  };
}
}
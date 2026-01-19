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

/**
 * Serwis obsługujący ankiety.
 * Zarządza tworzeniem ankiet, zbieraniem odpowiedzi i generowaniem statystyk.
 */
@Injectable()
export class SurveysService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Tworzy nową ankietę wraz z pytaniami.
   * Całość wykonuje się w transakcji bazy danych (wszystko albo nic).
   */
  async createSurvey(createdById: number, dto: CreateSurveyDto) {
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
        throw new BadRequestException('Ankieta musi zawierać co najmniej jedno pytanie');
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

  /**
   * Pobiera listę tylko aktywnych ankiet.
   */
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

  /**
   * Pobiera pełne szczegóły ankiety włącznie z pytaniami i opcjami.
   */
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
      throw new NotFoundException('Ankieta nie znaleziona');
    }

    return survey;
  }

  /**
   * Zapisuje odpowiedź pacjenta na ankietę.
   * Jeśli pacjent już dziś wypełnił tę ankietę, stara odpowiedź jest nadpisywana.
   */
  async saveTodayResponse(userId: number, dto: SubmitResponseDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.surveyResponse.findFirst({
        where: {
          userId,
          surveyId: dto.survey_id,
        },
      })

      if (existing) {
        await tx.surveyAnswer.deleteMany({
          where: {
            responseId: existing.id,
          },
        })

        await tx.surveyResponse.delete({
          where: { id: existing.id },
        })
      }

      const response = await tx.surveyResponse.create({
        data: {
          userId,
          surveyId: dto.survey_id,
          tookMedication: dto.took_medication ?? null,
          wellbeingRating: dto.wellbeing_rating ?? null,
        },
      })

      if (dto.answers?.length) {
        await tx.surveyAnswer.createMany({
          data: dto.answers.map(a => ({
            responseId: response.id,
            questionId: a.question_id,
            answerText: a.answer_text ?? null,
            answerValue: a.answer_value ?? null,
          })),
        })
      }

      return { success: true }
    })
  }

  /**
   * Aktualizuje istniejącą ankietę.
   * Usuwa stare pytania i tworzy nowe.
   */
  async updateSurvey(id: number, dto: UpdateSurveyDto) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Ankieta nie znaleziona');

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

  /**
   * Pobiera listę wszystkich odpowiedzi złożonych przez pacjentów na daną ankietę.
   */
  async listResponses(surveyId: number) {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new NotFoundException('Ankieta nie znaleziona');
    }

    const responses = await this.prisma.surveyResponse.findMany({
      where: { surveyId },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
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

  /**
   * Oblicza statystyki zbiorcze dla danej ankiety (np. średnie oceny, rozkład odpowiedzi).
   */
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
      throw new NotFoundException('Ankieta nie znaleziona');
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

  /**
   * Pobiera historię ankiet wypełnionych przez danego użytkownika (pacjenta).
   */
  async getMySurveyStatus(userId: number) {
    return this.prisma.surveyResponse.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        surveyId: true,
        updatedAt: true,
        wellbeingRating: true,
        tookMedication: true,
        survey: {
          select: {
            title: true,
            date: true
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      },
    })
  }

  /**
   * Pobiera szczegóły konkretnej odpowiedzi (dla podglądu).
   */
  async getMyResponse(userId: number, surveyId: number) {
    return this.prisma.surveyResponse.findFirst({
      where: { userId, surveyId },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });
  }

  /**
   * Znajduje wszystkich pacjentów przypisanych do terapeuty.
   * Szuka zarówno poprzez tabelę połączeń (PatientTherapist) jak i przez przypisane ankiety (SurveyAssignment).
   */
  async getTherapistPatients(therapistId: number) {
    const surveyAssignments = await this.prisma.surveyAssignment.findMany({
      where: {
        survey: {
          createdById: therapistId
        }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const surveyPatientIds = surveyAssignments.map(a => a.userId);

    const connections = await this.prisma.patientTherapist.findMany({
      where: {
        therapistId,
        status: 'ACTIVE'
      },
      select: { patientId: true }
    });

    const connectionPatientIds = connections.map(c => c.patientId);

    const allPatientIds = Array.from(new Set([...surveyPatientIds, ...connectionPatientIds]));

    return this.prisma.user.findMany({
      where: { id: { in: allPatientIds } },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        isActive: true,
        createdAt: true
      }
    });
  }

  /**
   * Generuje statystyki pacjenta dla wykresów w panelu terapeuty.
   * Oblicza średnie samopoczucie, ilość odpowiedzi i luki w wypełnianiu ankiet.
   */
  async getPatientStats(patientId: number, days: number) {
    const endDate = new Date();
    let startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const patientUser = await this.prisma.user.findUnique({
      where: { id: patientId },
      select: { createdAt: true }
    });

    let effectivePeriod = days;

    if (patientUser && startDate < patientUser.createdAt) {
      startDate = new Date(patientUser.createdAt);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      effectivePeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    }

    const responses = await this.prisma.surveyResponse.findMany({
      where: {
        userId: patientId,
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { updatedAt: 'asc' },
      select: {
        id: true,
        surveyId: true,
        updatedAt: true,
        wellbeingRating: true,
        tookMedication: true
      }
    });

    const total = responses.length;
    const ratings = responses
      .map(r => r.wellbeingRating)
      .filter((r): r is number => r !== null);

    const avgWellbeing = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    const missingDates: string[] = [];
    const responseDates = new Set(
      responses.map(r => r.updatedAt.toISOString().split('T')[0])
    );

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!responseDates.has(dateStr)) {
        missingDates.push(dateStr);
      }
    }

    return {
      patientId,
      period: effectivePeriod,
      total,
      avgWellbeing,
      responses: responses.map(r => ({
        surveyId: r.surveyId,
        date: r.updatedAt,
        wellbeing: r.wellbeingRating,
        medication: r.tookMedication
      })),
      missingDates
    };
  }

  /**
   * Przypisuje ankietę do konkretnych pacjentów.
   */
  async assignSurvey(surveyId: number, patientIds: number[], assignedById: number) {
    const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Ankieta nie znaleziona');

    const existing = await this.prisma.surveyAssignment.findMany({
      where: {
        surveyId,
        userId: { in: patientIds }
      }
    });

    const existingUserIds = new Set(existing.map(e => e.userId));
    const newUserIds = patientIds.filter(id => !existingUserIds.has(id));

    if (newUserIds.length > 0) {
      await this.prisma.surveyAssignment.createMany({
        data: newUserIds.map(userId => ({
          surveyId,
          userId,
          active: true
        }))
      });
    }

    return { assigned: newUserIds.length, skipped: existingUserIds.size };
  }

  /**
   * Główny dashboard terapeuty.
   * Identyfikuje pacjentów wymagających uwagi (niski nastrój, brak aktywności).
   */
  async getTherapistDashboardStats(therapistId: number) {
    const patients = await this.getTherapistPatients(therapistId);

    const lowWellbeingPatients = [];
    const missingSurveyPatients = [];

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    for (const patient of patients) {
      const responses = await this.prisma.surveyResponse.findMany({
        where: {
          userId: patient.id,
          updatedAt: { gte: sevenDaysAgo }
        },
        select: { wellbeingRating: true, updatedAt: true }
      });

      const ratings = responses.map(r => r.wellbeingRating).filter(r => r !== null) as number[];
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      if (ratings.length > 0 && avg < 4) {
        lowWellbeingPatients.push({
          ...patient,
          avgWellbeing: avg
        });
      }

      const lastActivityDate = responses.length > 0
        ? new Date(responses[responses.length - 1].updatedAt)
        : new Date(patient.createdAt);

      const diffTime = now.getTime() - lastActivityDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 2) {
        missingSurveyPatients.push({
          ...patient,
          daysSinceLast: diffDays
        });
      }
    }

    return {
      lowWellbeing: lowWellbeingPatients,
      missingSurveys: missingSurveyPatients,
      totalPatients: patients.length
    };
  }
}
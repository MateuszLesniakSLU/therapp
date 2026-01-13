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
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Tworzy nową ankietę.
   * @param createdById ID użytkownika tworzącego ankietę
   * @param dto Dane ankiety
   * @throws BadRequestException jeśli ankieta nie zawiera pytań
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

  /**
   * Pobiera listę aktywnych ankiet.
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
   * Pobiera szczegóły ankiety.
   * @param id ID ankiety
   * @throws NotFoundException jeśli ankieta nie zostanie znaleziona
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
      throw new NotFoundException('Survey not found');
    }

    return survey;
  }

  /**
   * Zapisuje odpowiedź na dzisiejszą ankietę.
   * @param userId ID użytkownika
   * @param dto Dane odpowiedzi
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
   * Aktualizuje ankietę.
   * @param id ID ankiety
   * @param dto Dane do aktualizacji
   * @throws NotFoundException jeśli ankieta nie zostanie znaleziona
   */
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

  /**
   * Pobiera listę odpowiedzi dla danej ankiety.
   * @param surveyId ID ankiety
   * @throws NotFoundException jeśli ankieta nie zostanie znaleziona
   */
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

  /**
   * Pobiera statystyki dla danej ankiety.
   * @param surveyId ID ankiety
   * @throws NotFoundException jeśli ankieta nie zostanie znaleziona
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

  /**
   * Pobiera status ankiet wypełnionych przez użytkownika.
   * @param userId ID użytkownika
   */
  async getMySurveyStatus(userId: number) {
    // Usunięto nadmiarowe pierwsze zapytanie
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
   * Pobiera odpowiedź użytkownika dla konkretnej ankiety.
   * @param userId ID użytkownika
   * @param surveyId ID ankiety
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
   * Pobiera listę pacjentów, którzy mają przypisane ankiety stworzone przez terapeutę.
   * @param therapistId ID terapeuty
   */
  async getTherapistPatients(therapistId: number) {
    // 1. Znajdź użytkowników z ankiet stworzonych przez terapeutę
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

    // 2. Znajdź użytkowników z tabeli połączeń (PatientTherapist)
    const connections = await this.prisma.patientTherapist.findMany({
      where: {
        therapistId,
        status: 'active'
      },
      select: { patientId: true }
    });

    const connectionPatientIds = connections.map(c => c.patientId);

    // 3. Połącz listy ID (unikalne)
    const allPatientIds = Array.from(new Set([...surveyPatientIds, ...connectionPatientIds]));

    // 4. Pobierz dane użytkowników
    return this.prisma.user.findMany({
      where: { id: { in: allPatientIds } },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        email: true,
        isActive: true
      }
    });
  }

  /**
   * Pobiera statystyki pacjenta dla terapeuty.
   * @param patientId ID pacjenta
   * @param days Ilość dni wstecz (np. 7, 14, 30, 365)
   */
  async getPatientStats(patientId: number, days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // 1. Pobierz odpowiedzi z zakresu dat
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

    // 2. Oblicz statystyki podstawowe
    const total = responses.length;
    const ratings = responses
      .map(r => r.wellbeingRating)
      .filter((r): r is number => r !== null);

    const avgWellbeing = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

    // 3. Wyznacz dni brakujące (Missing Surveys)
    // Zakładamy, że pacjent powinien wypełniać ankietę codziennie?
    // Iterujemy dzień po dniu od startDate do endDate.
    const missingDates: string[] = [];
    const responseDates = new Set(
      responses.map(r => r.updatedAt.toISOString().split('T')[0])
    );

    const activeSurveys = await this.prisma.surveyAssignment.findMany({
      where: { userId: patientId },
      include: { survey: true }
    });
    // Jeśli pacjent nie ma przypisanych aktywnych ankiet w danym dniu, to nie liczmy tego jako brak.
    // Uproszczenie: Przyjmujemy, że jeśli ma JAKĄKOLWIEK ankietę do zrobienia, to powinien ją zrobić.
    // Lepsze podejście: Sprawdzamy czy w danym dniu była chociaż 1 odpowiedź.

    // Pętla po dnaich
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (!responseDates.has(dateStr)) {
        missingDates.push(dateStr);
      }
    }

    return {
      patientId,
      period: days,
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
   * Przypisuje ankietę do pacjentów.
   */
  async assignSurvey(surveyId: number, patientIds: number[], assignedById: number) {
    const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Survey not found');

    if (survey.createdById !== assignedById) {
      // Opcjonalnie: sprawdzaj uprawnienia, czy terapeuta może przypisać tę ankietę
    }

    // Usunięcie starych przypisań dla tych pacjentów (jeśli chcemy nadpisać)
    // Lub po prostu dodanie nowych. Przyjmijmy dodanie/zaktualizowanie.
    // W tym modelu SurveyAssignment łączy usera i ankietę.

    // Sprawdźmy czy już mają przypisaną
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
   * Pobiera statystyki do dashboardu terapeuty.
   */
  async getTherapistDashboardStats(therapistId: number) {
    const patients = await this.getTherapistPatients(therapistId);

    const lowWellbeingPatients = [];
    const missingSurveyPatients = [];

    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    for (const patient of patients) {
      // Calculate Avg Wellbeing (last 7 days)
      const responses = await this.prisma.surveyResponse.findMany({
        where: {
          userId: patient.id,
          updatedAt: { gte: sevenDaysAgo }
        },
        select: { wellbeingRating: true, updatedAt: true }
      });

      const ratings = responses.map(r => r.wellbeingRating).filter(r => r !== null) as number[];
      const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      if (ratings.length > 0 && avg < 4) { // Threshold for "Low Wellbeing"
        lowWellbeingPatients.push({
          ...patient,
          avgWellbeing: avg
        });
      }

      // Check for missing survey TODAY
      const today = now.toISOString().split('T')[0];

      // Simple logic: if no response today (and maybe yesterday?), flag it.
      // Let's flag if no response in last 3 days for alert
      if (responses.length === 0) {
        missingSurveyPatients.push({ ...patient, daysSinceLast: '7+' });
      } else {
        // Calculate days diff
        const last = new Date(responses[responses.length - 1].updatedAt);
        const diffTime = Math.abs(now.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 2) {
          missingSurveyPatients.push({ ...patient, daysSinceLast: diffDays });
        }
      }
    }

    return {
      lowWellbeing: lowWellbeingPatients,
      missingSurveys: missingSurveyPatients,
      totalPatients: patients.length
    };
  }
}
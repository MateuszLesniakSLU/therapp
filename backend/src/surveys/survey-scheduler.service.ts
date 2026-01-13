import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SurveySchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SurveySchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    //Utwórz ankietę o 00:00
    cron.schedule(
      '0 0 * * *',
      () => {
        this.logger.log('Uruchamianie codziennego cyklu ankiet...');
        this.runDailySurveyCycle().catch((err) => {
          this.logger.error('Nie udało się utworzyć nowej ankiety', err);
        });
      },
      { timezone: 'Europe/Warsaw' },
    );

    this.logger.log('SurveySchedulerService ustawiony na (codziennie o 00:00)');
  }

  async runDailySurveyCycle() {
    const now = new Date();
    const surveyDate = new Date(
      now.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' }),
    );

    const todayLabel = surveyDate.toISOString().split('T')[0];
    const title = `Ankieta dnia ${todayLabel}`;

    await this.prisma.$transaction(async (tx) => {
      // Zamyka stare ankiety
      await tx.survey.updateMany({
        where: { active: true },
        data: { active: false },
      });

      // Sprawdza czy ankieta istnieje, jeżeli tak to przerywa
      const exists = await tx.survey.findUnique({
        where: { date: surveyDate },
      });

      if (exists) {
        this.logger.warn(
          `Ankieta dla ${todayLabel} już istnieje — pomijanie tworzenia ankiety`,
        );
        return;
      }

      // 3️⃣ POBIERZ AKTYWNYCH PACJENTÓW
      const patients = await tx.user.findMany({
        where: {
          role: 'patient',
          isActive: true,
        },
        select: { id: true },
      });

      if (patients.length === 0) {
        this.logger.warn('Brak aktywnych pacjentów — pomijanie tworzenia ankiety');
        return;
      }

      // 4️⃣ UTWÓRZ NOWĄ ANKIETĘ (AKTYWNĄ)
      const survey = await tx.survey.create({
        data: {
          title,
          description: 'Daily wellbeing survey',
          date: surveyDate,
          active: true,
          createdById: 1,
        },
      });

      // 5️⃣ STAŁY ZESTAW PYTAŃ
      const questions = [
        { text: 'Jak się dzisiaj czujesz?', type: 'rating' },
        { text: 'Jak minął dzień?', type: 'text' },
        { text: 'Czy wziąłeś dzisiaj leki?', type: 'choice' },
        { text: 'Jeżeli tak – czy wystąpiły efekty uboczne?', type: 'text' },
        { text: 'Jeżeli nie – dlaczego nie przyjąłeś leków?', type: 'text' },
        { text: 'Inne przemyślenia', type: 'text' },
      ];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        const question = await tx.surveyQuestion.create({
          data: {
            surveyId: survey.id,
            questionText: q.text,
            questionType: q.type,
            required: true,
            order: i,
          },
        });

        if (q.type === 'choice') {
          await tx.surveyQuestionOption.createMany({
            data: [
              { questionId: question.id, text: 'Tak', order: 0 },
              { questionId: question.id, text: 'Nie', order: 1 },
            ],
          });
        }
      }

      // 6️⃣ AUTO-PRZYPISANIE DO WSZYSTKICH PACJENTÓW
      await tx.surveyAssignment.createMany({
        data: patients.map((p) => ({
          surveyId: survey.id,
          userId: p.id,
        })),
        skipDuplicates: true,
      });

      this.logger.log(`Codzienna ankieta ${survey.id} dla ${todayLabel} utworzona`);
    });
  }
}

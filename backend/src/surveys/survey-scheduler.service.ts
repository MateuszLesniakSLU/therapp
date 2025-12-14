// src/surveys/survey-scheduler.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { Pool } from 'pg';
import { Inject } from '@nestjs/common';

@Injectable()
export class SurveySchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SurveySchedulerService.name);

  constructor(@Inject('PG_POOL') private pool: Pool) {}

  onModuleInit() {
    cron.schedule(
      '0 0 * * *',
      () => {
        this.logger.log('Starting daily survey creation job');
        this.runDailyCreation().catch((err) => {
          this.logger.error('Daily survey creation failed', err);
        });
      },
      { timezone: 'Europe/Warsaw' }
    );

    this.logger.log('SurveySchedulerService scheduled (0 0 * * *)');
  }

  async runDailyCreation() {
    const client = await this.pool.connect();
    try {
      const templatesRes = await client.query(
        `SELECT id, title, description, created_by FROM survey_templates`
      );

      for (const tpl of templatesRes.rows) {
        await client.query('BEGIN');

        const exists = await client.query(
          `SELECT 1 FROM surveys WHERE title = $1 AND created_at::date = CURRENT_DATE`,
          [tpl.title]
        );
        if (exists.rows.length > 0) {
          this.logger.log(`Survey for template ${tpl.id} already created today — skipping`);
          await client.query('ROLLBACK');
          continue;
        }

        const surveyRes = await client.query(
          `INSERT INTO surveys (title, description, created_by, active, locked, created_at)
           VALUES ($1, $2, $3, TRUE, TRUE, NOW()) RETURNING id`,
          [tpl.title, tpl.description ?? null, tpl.created_by ?? null]
        );
        const surveyId = surveyRes.rows[0].id;

        const qRes = await client.query(
          `SELECT id, question_text, question_type, required, ord
           FROM survey_template_questions WHERE template_id = $1 ORDER BY ord`,
          [tpl.id]
        );

        for (const question of qRes.rows) {
          const insertQuestionResult = await client.query(
            `INSERT INTO survey_questions 
               (survey_id, question_text, question_type, required, ord)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [surveyId, question.question_text, question.question_type, question.required ?? true, question.ord]
          );
          const newQuestionId = insertQuestionResult.rows[0].id;

          if (question.question_type === 'choice') {
            const options = await client.query(
              `SELECT option_text, ord FROM survey_template_question_options WHERE template_question_id = $1 ORDER BY ord`,
              [question.id]
            );
            for (const opt of options.rows) {
              await client.query(
                `INSERT INTO survey_question_options (question_id, option_text, ord) VALUES ($1, $2, $3)`,
                [newQuestionId, opt.option_text, opt.ord]
              );
            }
          }
        }

        const usersRes = await client.query(`SELECT id FROM users WHERE role = 'patient'`);
        for (const u of usersRes.rows) {
          await client.query(
            `INSERT INTO survey_assignments (survey_id, user_id, expires_at, assigned_at)
             VALUES ($1, $2, NULL, NOW())
             ON CONFLICT (survey_id, user_id) DO NOTHING`,
            [surveyId, u.id]
          );
        }

        await client.query('COMMIT');
        this.logger.log(`Created survey ${surveyId} from template ${tpl.id}`);
      }
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }
}

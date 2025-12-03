// src/surveys/surveys.service.ts
import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { SubmitResponseDto, AnswerDto } from './dto/submit-response.dto';

@Injectable()
export class SurveysService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async createSurvey(createdBy: number, dto: CreateSurveyDto): Promise<{ id: number }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const insertSurveyResult = await client.query(
        `INSERT INTO surveys (title, description, created_by) VALUES ($1, $2, $3) RETURNING id`,
        [dto.title, dto.description ?? null, createdBy]
      );
      const surveyId: number = insertSurveyResult.rows[0].id;

      if (dto.questions && Array.isArray(dto.questions)) {
        for (let i = 0; i < dto.questions.length; i++) {
          const questionDto = dto.questions[i];
          const questionType = questionDto.question_type;
          if (!['text', 'number', 'choice', 'rating'].includes(questionType)) {
            throw new BadRequestException(`Invalid question type: ${questionType}`);
          }

          const insertQuestionResult = await client.query(
            `INSERT INTO survey_questions (survey_id, question_text, question_type, required, ord)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [surveyId, questionDto.question_text, questionType, questionDto.required ?? true, i]
          );
          const questionId: number = insertQuestionResult.rows[0].id;

          if (questionType === 'choice' && questionDto.options && Array.isArray(questionDto.options)) {
            for (let j = 0; j < questionDto.options.length; j++) {
              const optionDto = questionDto.options[j];
              await client.query(
                `INSERT INTO survey_question_options (question_id, option_text, ord)
                 VALUES ($1, $2, $3)`,
                [questionId, optionDto.option_text, j]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      return { id: surveyId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listSurveys(): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT id, title, description, created_by, created_at, active
       FROM surveys
       WHERE active = TRUE
       ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getSurvey(surveyId: number): Promise<any> {
    const surveyResult = await this.pool.query(
      `SELECT id, title, description, created_by, created_at, active
       FROM surveys
       WHERE id = $1`,
      [surveyId]
    );
    if (surveyResult.rows.length === 0) {
      throw new NotFoundException('Survey not found');
    }
    const survey = surveyResult.rows[0];

    const questionsResult = await this.pool.query(
      `SELECT id, question_text, question_type, required, ord
       FROM survey_questions
       WHERE survey_id = $1
       ORDER BY ord`,
      [surveyId]
    );
    const questions = questionsResult.rows;

    const choiceQuestionIds = questions
      .filter(question => question.question_type === 'choice')
      .map(question => question.id);

    let questionOptionsMap: Record<number, any[]> = {};
    if (choiceQuestionIds.length > 0) {
      const optionsResult = await this.pool.query(
        `SELECT id, question_id, option_text, ord
         FROM survey_question_options
         WHERE question_id = ANY($1::int[])
         ORDER BY question_id, ord`,
        [choiceQuestionIds]
      );
      for (const optionRow of optionsResult.rows) {
        if (!questionOptionsMap[optionRow.question_id]) {
          questionOptionsMap[optionRow.question_id] = [];
        }
        questionOptionsMap[optionRow.question_id].push({
          id: optionRow.id,
          option_text: optionRow.option_text,
          ord: optionRow.ord
        });
      }
    }

    const assembledQuestions = questions.map(question => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      required: question.required,
      ord: question.ord,
      options: questionOptionsMap[question.id] ?? []
    }));

    return {
      ...survey,
      questions: assembledQuestions
    };
  }

  async updateSurvey(surveyId: number, dto: UpdateSurveyDto): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const updateSurveyResult = await client.query(
        `UPDATE surveys
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             active = COALESCE($3, active)
         WHERE id = $4
         RETURNING id, title, description, created_by, created_at, active`,
        [dto.title ?? null, dto.description ?? null, dto.is_active ?? null, surveyId]
      );

      if (updateSurveyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('Survey not found');
      }

      if (dto.questions && Array.isArray(dto.questions)) {
        await client.query(`DELETE FROM survey_question_options WHERE question_id IN (SELECT id FROM survey_questions WHERE survey_id = $1)`, [surveyId]);
        await client.query(`DELETE FROM survey_questions WHERE survey_id = $1`, [surveyId]);

        for (let i = 0; i < dto.questions.length; i++) {
          const questionDto = dto.questions[i];
          const questionType = questionDto.question_type ?? 'text';
          if (!['text', 'number', 'choice', 'rating'].includes(questionType)) {
            await client.query('ROLLBACK');
            throw new BadRequestException(`Invalid question type: ${questionType}`);
          }

          const insertQuestionResult = await client.query(
            `INSERT INTO survey_questions (survey_id, question_text, question_type, required, ord)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [surveyId, questionDto.question_text ?? '', questionType, questionDto.required ?? true, i]
          );
          const questionId: number = insertQuestionResult.rows[0].id;

          if (questionType === 'choice' && questionDto.options && Array.isArray(questionDto.options)) {
            for (let j = 0; j < questionDto.options.length; j++) {
              const optionDto = questionDto.options[j];
              await client.query(
                `INSERT INTO survey_question_options (question_id, option_text, ord)
                 VALUES ($1, $2, $3)`,
                [questionId, optionDto.option_text ?? '', j]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      return updateSurveyResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async setActive(surveyId: number, active: boolean): Promise<any> {
    const result = await this.pool.query(
      `UPDATE surveys SET active = $1 WHERE id = $2 RETURNING id, title, description, created_by, created_at, active`,
      [active, surveyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Survey not found');
    }
    return result.rows[0];
  }

  async assignSurveyToUsers(surveyId: number, userIds: number[], expiresAt?: string): Promise<any> {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('userIds are required');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const surveyCheck = await client.query(`SELECT id FROM surveys WHERE id = $1`, [surveyId]);
      if (surveyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('Survey not found');
      }

      const assignedRows: { user_id: number; expires_at: string | null }[] = [];

      for (const userId of userIds) {
        const insertResult = await client.query(
          `INSERT INTO survey_assignments (survey_id, user_id, expires_at, assigned_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (survey_id, user_id) DO UPDATE SET expires_at = EXCLUDED.expires_at
           RETURNING user_id, expires_at`,
          [surveyId, userId, expiresAt ?? null]
        );
        assignedRows.push({
          user_id: insertResult.rows[0].user_id,
          expires_at: insertResult.rows[0].expires_at
        });
      }

      await client.query('COMMIT');
      return { assigned: assignedRows };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async submitResponse(userId: number, surveyId: number, dto: SubmitResponseDto): Promise<{ id: number }> {
    if (!Array.isArray(dto.answers) || dto.answers.length === 0) {
      throw new BadRequestException('Answers are required');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const surveyCheckResult = await client.query(`SELECT id, active FROM surveys WHERE id = $1`, [surveyId]);
      if (surveyCheckResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new NotFoundException('Survey not found');
      }
      if (!surveyCheckResult.rows[0].active) {
        await client.query('ROLLBACK');
        throw new BadRequestException('Survey is not active');
      }

      const insertResponseResult = await client.query(
        `INSERT INTO survey_responses (survey_id, user_id, submitted_at)
         VALUES ($1, $2, NOW()) RETURNING id`,
        [surveyId, userId]
      );
      const responseId: number = insertResponseResult.rows[0].id;

      const questionsResult = await client.query(
        `SELECT id, question_type, required FROM survey_questions WHERE survey_id = $1`,
        [surveyId]
      );
      const surveyQuestionsMap = new Map<number, { question_type: string; required: boolean }>();
      for (const questionRow of questionsResult.rows) {
        surveyQuestionsMap.set(questionRow.id, { question_type: questionRow.question_type, required: questionRow.required });
      }

      for (const answer of dto.answers as AnswerDto[]) {
        const questionInfo = surveyQuestionsMap.get(answer.question_id);
        if (!questionInfo) {
          await client.query('ROLLBACK');
          throw new BadRequestException(`Invalid question id: ${answer.question_id}`);
        }

        if (questionInfo.question_type === 'rating') {
          if (typeof answer.answer_value !== 'number' || !Number.isInteger(answer.answer_value)) {
            await client.query('ROLLBACK');
            throw new BadRequestException(`Answer for question ${answer.question_id} must be integer 0..10`);
          }
          if (answer.answer_value < 0 || answer.answer_value > 10) {
            await client.query('ROLLBACK');
            throw new BadRequestException(`Answer for question ${answer.question_id} out of range (0..10)`);
          }
          await client.query(
            `INSERT INTO survey_answers (response_id, question_id, answer_value) VALUES ($1, $2, $3)`,
            [responseId, answer.question_id, answer.answer_value]
          );
        } else if (questionInfo.question_type === 'number') {
          let numericValue: number | null = null;
          if (typeof answer.answer_value === 'number') {
            numericValue = answer.answer_value;
          } else if (answer.answer_text !== undefined && answer.answer_text !== null) {
            const parsed = Number(answer.answer_text);
            if (!Number.isFinite(parsed)) {
              await client.query('ROLLBACK');
              throw new BadRequestException(`Answer for question ${answer.question_id} must be a number`);
            }
            numericValue = parsed;
          } else if (questionInfo.required) {
            await client.query('ROLLBACK');
            throw new BadRequestException(`Answer for question ${answer.question_id} is required`);
          }
          await client.query(
            `INSERT INTO survey_answers (response_id, question_id, answer_text, answer_value) VALUES ($1, $2, $3, $4)`,
            [responseId, answer.question_id, numericValue !== null ? String(numericValue) : null, numericValue]
          );
        } else {
          const answerText = answer.answer_text ?? null;
          if (questionInfo.required && (!answerText || answerText.trim() === '')) {
            await client.query('ROLLBACK');
            throw new BadRequestException(`Answer for question ${answer.question_id} is required`);
          }
          await client.query(
            `INSERT INTO survey_answers (response_id, question_id, answer_text) VALUES ($1, $2, $3)`,
            [responseId, answer.question_id, answerText]
          );
        }
      }

      await client.query('COMMIT');
      return { id: responseId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listResponses(surveyId: number): Promise<any[]> {
    const responsesResult = await this.pool.query(
      `SELECT r.id AS response_id, r.user_id, u.username, r.submitted_at
       FROM survey_responses r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.survey_id = $1
       ORDER BY r.submitted_at DESC`,
      [surveyId]
    );

    const responseIds = responsesResult.rows.map(row => row.response_id);
    let answersMap: Record<number, any[]> = {};

    if (responseIds.length > 0) {
      const answersResult = await this.pool.query(
        `SELECT id, response_id, question_id, answer_text, answer_value
         FROM survey_answers
         WHERE response_id = ANY($1::int[])
         ORDER BY id`,
        [responseIds]
      );

      for (const answerRow of answersResult.rows) {
        if (!answersMap[answerRow.response_id]) {
          answersMap[answerRow.response_id] = [];
        }
        answersMap[answerRow.response_id].push({
          id: answerRow.id,
          question_id: answerRow.question_id,
          answer_text: answerRow.answer_text,
          answer_value: answerRow.answer_value
        });
      }
    }

    return responsesResult.rows.map(row => ({
      response_id: row.response_id,
      user_id: row.user_id,
      username: row.username,
      submitted_at: row.submitted_at,
      answers: answersMap[row.response_id] ?? []
    }));
  }

  async getStats(surveyId: number): Promise<any> {
    const questionsResult = await this.pool.query(
      `SELECT id, question_text, question_type
       FROM survey_questions
       WHERE survey_id = $1
       ORDER BY ord`,
      [surveyId]
    );

    const stats: any = { surveyId, questions: [] };

    for (const question of questionsResult.rows) {
      const questionId = question.id;

      if (question.question_type === 'rating' || question.question_type === 'number') {
        const averageResult = await this.pool.query(
          `SELECT AVG(answer_value)::numeric(10,2) AS avg_value, COUNT(answer_value) AS total_count
           FROM survey_answers
           WHERE question_id = $1 AND answer_value IS NOT NULL`,
          [questionId]
        );

        const distributionResult = await this.pool.query(
          `SELECT answer_value, COUNT(*) AS count
           FROM survey_answers
           WHERE question_id = $1 AND answer_value IS NOT NULL
           GROUP BY answer_value
           ORDER BY answer_value`,
          [questionId]
        );

        stats.questions.push({
          question_id: questionId,
          question_text: question.question_text,
          question_type: question.question_type,
          avg: averageResult.rows[0].avg_value !== null ? Number(averageResult.rows[0].avg_value) : null,
          count: Number(averageResult.rows[0].total_count),
          distribution: distributionResult.rows.map(row => ({ value: row.answer_value, count: Number(row.count) }))
        });
      } else if (question.question_type === 'choice') {
        const choiceStatsResult = await this.pool.query(
          `SELECT answer_text, COUNT(*) AS count
           FROM survey_answers
           WHERE question_id = $1 AND answer_text IS NOT NULL
           GROUP BY answer_text
           ORDER BY count DESC`,
          [questionId]
        );

        stats.questions.push({
          question_id: questionId,
          question_text: question.question_text,
          question_type: question.question_type,
          choices: choiceStatsResult.rows.map(row => ({ option: row.answer_text, count: Number(row.count) }))
        });
      } else {
        const textCountResult = await this.pool.query(
          `SELECT COUNT(*) AS count
           FROM survey_answers
           WHERE question_id = $1 AND answer_text IS NOT NULL`,
          [questionId]
        );

        stats.questions.push({
          question_id: questionId,
          question_text: question.question_text,
          question_type: question.question_type,
          count: Number(textCountResult.rows[0].count)
        });
      }
    }

    return stats;
  }

  async restoreSurvey(surveyId: number): Promise<any> {
    const result = await this.pool.query(
      `UPDATE surveys SET active = TRUE WHERE id = $1 RETURNING id, title, description, created_by, created_at, active`,
      [surveyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Survey not found');
    }
    return result.rows[0];
  }
}

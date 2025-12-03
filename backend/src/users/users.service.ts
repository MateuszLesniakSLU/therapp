import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class UsersService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async findAllUsers() {
    const result = await this.pool.query(
      `SELECT id, username, email, role, first_name, last_name, created_at
       FROM users
       WHERE COALESCE(deleted, FALSE) = FALSE`
    );
    return result.rows;
  }

  async findUserById(id: number) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) throw new BadRequestException('Invalid id');
    const result = await this.pool.query(
      `SELECT id, username, email, role, first_name, last_name, created_at
       FROM users
       WHERE id = $1`,
      [idNum]
    );
    return result.rows[0] || null;
  }

  async findByUsername(username: string) {
    const result = await this.pool.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  }

  async createUser(
    username: string,
    password: string,
    email?: string,
    role = 'patient',
    first_name?: string,
    last_name?: string,
  ) {
    const res = await this.pool.query(
      `INSERT INTO users (username, password, email, role, first_name, last_name, created_at, deleted)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), FALSE)
       RETURNING id, username, email, role, first_name, last_name, created_at`,
      [username, password, email ?? null, role, first_name ?? null, last_name ?? null]
    );
    return res.rows[0];
  }

  async updateUser(id: number, data: { username?: string; email?: string; first_name?: string; last_name?: string }) {
    const { username, email, first_name, last_name } = data;
    const res = await this.pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           email = COALESCE($2, email),
           first_name = COALESCE($3, first_name),
           last_name = COALESCE($4, last_name)
       WHERE id = $5
       RETURNING id, username, email, role, first_name, last_name, created_at`,
      [username ?? null, email ?? null, first_name ?? null, last_name ?? null, id]
    );
    return res.rows[0] || null;
  }

  async softDeleteUser(id: number) {
    await this.pool.query(
      `UPDATE users SET deleted = TRUE WHERE id = $1`,
      [id]
    );
    return { message: 'User marked as deleted' };
  }

  async restoreUser(id: number) {
    const result = await this.pool.query(
      `UPDATE users SET deleted = FALSE WHERE id = $1 RETURNING id, username, email, role, first_name, last_name, created_at`,
      [id]
    );
    if (result.rows.length === 0) return { message: 'User not found' };
    return { message: 'User restored', user: result.rows[0] };
  }
}

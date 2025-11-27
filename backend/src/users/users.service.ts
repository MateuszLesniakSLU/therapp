import {Inject, Injectable} from "@nestjs/common";
import { Pool } from 'pg';

@Injectable()
export class UsersService {
    constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

    // GET /users - pobierz wszystkich użytkowników
    async findAllUsers() {
        const result = await this.pool.query(
            `SELECT id, username, email, created_at, deleted 
             FROM users 
             WHERE deleted = FALSE OR deleted IS NULL`
        );
        return result.rows;
    }

    // GET /users/:id - pobierz konkretnego usera o :id
    async findUserById(id: number) {
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    // SEARCH - wyszukiwanie po username (do logowania)
    async findUserByUsername(username: string) {
        const result = await this.pool.query(
            `SELECT * FROM users WHERE username = $1`,
            [username]
        );
        return result.rows[0];
    }

    //POST /auth/register - utwórz użytkownika
    async createUser(username: string, password: string, email?: string) {
        const result = await this.pool.query(
            'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, NOW(), FALSE) RETURNING id, username, email, created_at',
            [username, password, email],
        );
        return result.rows[0];
    }

    // PATCH /users/:id - zaktualizuj dane
    async updateUser(id: number, data: { username?: string, email?: string }) {
        const { username, email } = data;

        const result = await this.pool.query(
            `UPDATE users
            SET
            username = COALESCE($1, username),
            email = COALESCE($2, email),
            WHERE id = $3,
            RETURNING id, username, email, created_at`,
            [username ?? null, email ?? null, id]
        );

        return result.rows[0];
    }

    // DELETE /users/:id - soft delete
    async softDeleteUser(id: number) {
        await this.pool.query(
            `UPDATE users SET deleted = TRUE WHERE id = $1`,
            [id]
        );

        return { message: 'Użytkownik oznaczony jako usunięty' };
    }
}
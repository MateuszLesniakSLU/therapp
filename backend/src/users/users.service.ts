import {Inject, Injectable} from "@nestjs/common";
import {Pool} from 'pg';

@Injectable()
export class UsersService {
    constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

    async findAll() {
        const result = await this.pool.query('SELECT * FROM users');
        return result.rows;
    }

    async findByUsername(username: string) {
        const result = await this.pool.query('SELECT * FROM users where username = $1', [username]);
        return result.rows[0];
    }

    async findById(id: number) {
        const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }

    async createUser(username: string, password: string, email?: string) {
        const result = await this.pool.query(
            'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [username, password, email],
        );
        return result.rows[0];
    }
}
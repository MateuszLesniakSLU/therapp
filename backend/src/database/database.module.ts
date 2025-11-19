import { Module } from '@nestjs/common';
import { Pool } from 'pg';

const dbProvider = {
    provide: 'PG_POOL',
    useFactory : async () => {
        const pool: Pool = new Pool({
            host : 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'Haslo123',
            database: 'thera_app',
        });
        return pool;
    },
};

@Module({
    providers: [dbProvider],
    exports: ['PG_POOL'],
})
export class DatabaseModule {}
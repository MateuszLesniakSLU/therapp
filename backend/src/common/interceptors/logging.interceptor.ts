
import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    constructor(private readonly logsService: ActivityLogsService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;
        const url = request.url;
        const ip = request.ip;

        return next.handle().pipe(
            tap(() => {
                // Optional: Log success for specific critical actions if needed
                // For now we rely on explicit service calls for important successes
            }),
            catchError((error) => {
                if (user && user.userId) {
                    const status = error instanceof HttpException ? error.getStatus() : 500;
                    // Log errors (4xx/5xx)
                    this.logsService.createLog(
                        user.userId,
                        `ERROR_Request`,
                        {
                            method,
                            url,
                            error: error.message,
                            status
                        },
                        ip,
                        'ERROR'
                    ).catch(err => this.logger.error('Failed to log error to DB', err));
                }
                return throwError(() => error);
            }),
        );
    }
}

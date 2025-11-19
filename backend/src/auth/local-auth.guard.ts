import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

//Guard odpowiedzialny za wymuszenie logowania przy użyciu LocalStrategy
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
import { IsEmail, IsOptional, isString, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  role!: string;
}

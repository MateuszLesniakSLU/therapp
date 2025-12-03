import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  old_password!: string;

  @IsString()
  @MinLength(12)
  new_password!: string;
}

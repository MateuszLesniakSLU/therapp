import { IsArray, ValidateNested, IsInt, IsOptional, Min, Max, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsInt()
  question_id!: number;

  @IsOptional()
  @IsString()
  answer_text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  answer_value?: number;
}

export class SubmitResponseDto {
  @IsInt()
  survey_id!: number

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  took_medication?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  wellbeing_rating?: number;
}

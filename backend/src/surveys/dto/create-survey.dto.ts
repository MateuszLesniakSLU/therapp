import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSurveyQuestionOptionDto {
  @IsString()
  option_text!: string;

  @IsOptional()
  @IsInt()
  ord?: number;
}

export class CreateSurveyQuestionDto {
  @IsString()
  question_text!: string;

  @IsString()
  @IsIn(['text', 'number', 'choice', 'rating'])
  question_type!: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  ord?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionOptionDto)
  options?: CreateSurveyQuestionOptionDto[];
}

export class CreateSurveyDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSurveyQuestionDto)
  questions?: CreateSurveyQuestionDto[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  patientIds?: number[];
}

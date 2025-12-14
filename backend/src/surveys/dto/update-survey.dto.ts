import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSurveyQuestionOptionDto {
    @IsOptional()
    @IsString()
    option_text?: string;

    @IsOptional()
    @IsInt()
    ord?: number;
}

export class UpdateSurveyQuestionDto {
    @IsOptional()
    @IsString()
    question_text?: string;

    @IsOptional()
    @IsString()
    @IsIn(['text', 'number', 'choice', 'rating'])
    question_type?: string;

    @IsOptional()
    @IsBoolean()
    required?: boolean;

    @IsOptional()
    @IsInt()
    ord?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSurveyQuestionOptionDto)
    options?: UpdateSurveyQuestionOptionDto[];
}

export class UpdateSurveyDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateSurveyQuestionDto)
    questions?: UpdateSurveyQuestionDto[];
}
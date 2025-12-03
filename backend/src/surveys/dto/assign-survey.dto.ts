import { IsArray, IsInt, ArrayNotEmpty, IsOptional, IsISO8601 } from "class-validator";
import { Type } from "class-transformer";

export class AssignSurveyDto {
    @IsArray()
    @ArrayNotEmpty()
    @Type(() => Number)
    @IsInt({ each: true })
    user_ids!: number[];

    @IsOptional()
    @IsISO8601()
    expires_at?: string;
}

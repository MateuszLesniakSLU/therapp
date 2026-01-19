import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ContactMessageDto {
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Length(10, 2000)
    message!: string;
}

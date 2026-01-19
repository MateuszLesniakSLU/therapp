import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { ContactMessageDto } from './dto/contact-message.dto';
import { Public } from '../auth/public.decorator';

@Controller('contact')
export class ContactController {
    constructor(private readonly emailService: EmailService) { }

    @Public()
    @Post()
    async sendMessage(@Body() dto: ContactMessageDto) {
        await this.emailService.sendContactMessage(dto.email, dto.message);
        return { message: 'Wiadomość została wysłana pomyślnie.' };
    }
}

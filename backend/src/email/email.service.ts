import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
    private transporter!: nodemailer.Transporter;

    async onModuleInit() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@therapp.local',
            to: email,
            subject: 'Potwierdź swój adres email - TherApp',
            html: `
        <h1>Witaj w TherApp!</h1>
        <p>Kliknij poniższy link, aby aktywować swoje konto:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>Link wygasa za 24 godziny.</p>
      `,
        });
    }

    async sendPasswordResetEmail(email: string, token: string) {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@therapp.local',
            to: email,
            subject: 'Reset hasła - TherApp',
            html: `
        <h1>Reset hasła</h1>
        <p>Kliknij poniższy link, aby zresetować swoje hasło:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Link wygasa za 1 godzinę.</p>
        <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
      `,
        });
    }
    async sendContactMessage(email: string, message: string) {
        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@therapp.local',
            to: process.env.SMTP_FROM || 'admin@therapp.local',
            replyTo: email,
            subject: `Nowa wiadomość kontaktowa od ${email}`,
            text: `Od: ${email}\n\nWiadomość:\n${message}`,
            html: `
        <h3>Nowa wiadomość kontaktowa ze strony głównej</h3>
        <p><strong>Od:</strong> ${email}</p>
        <p><strong>Treść wiadomości:</strong></p>
        <p style="white-space: pre-wrap;">${message}</p>
      `,
        });
    }

    /**
     * Wysyła email z linkiem do ponownej aktywacji konta.
     * Używane gdy administrator dezaktywuje konto użytkownika.
     */
    async sendReactivationEmail(email: string, token: string) {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@therapp.local',
            to: email,
            subject: 'Twoje konto zostało dezaktywowane - TherApp',
            html: `
        <h1>Twoje konto zostało dezaktywowane</h1>
        <p>Administrator dezaktywował Twoje konto w systemie TherApp.</p>
        <p>Jeśli chcesz ponownie korzystać z aplikacji, musisz najpierw poczekać na reaktywację konta przez administratora, a następnie kliknąć poniższy link aby potwierdzić swój adres email:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>Link wygasa za 24 godziny.</p>
        <p>Jeśli masz pytania, skontaktuj się z administratorem.</p>
      `,
        });
    }
}

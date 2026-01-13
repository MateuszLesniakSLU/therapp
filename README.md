# TherApp

Aplikacja terapeutyczna zbudowana w oparciu o **NestJS** (Backend) oraz **Vue 3 + Vuetify** (Frontend).

## Struktura Projektu

- **backend**: API NestJS z Prisma ORM i PostgreSQL.
- **frontend**: Aplikacja Vue 3 wykorzystująca Vite i komponenty Vuetify.

## Pierwsze kroki

### Wymagania wstępne

- Node.js
- Docker i Docker Compose (dla bazy danych)

### Konfiguracja Backend'u

1. Przejdź do katalogu backendu:
   ```bash
   cd backend
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Skonfiguruj zmienne środowiskowe:
   Skopiuj `.env.example` do `.env` i dostosuj wartości jeśli to konieczne.
   ```bash
   cp .env.example .env
   ```
4. Uruchom bazę danych:
   ```bash
   docker-compose up -d
   ```
5. Uruchom migracje:
   ```bash
   npx prisma migrate dev
   ```
6. Uruchom serwer:
   ```bash
   npm run start:dev
   ```

### Konfiguracja Frontend'u

1. Przejdź do katalogu frontendu:
   ```bash
   cd frontend
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

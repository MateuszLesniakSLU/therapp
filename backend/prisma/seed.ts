import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as bcrypt from 'bcrypt'
import { Pool } from 'pg'

// 🔌 pool do Postgresa
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// 🔌 adapter Prisma
const adapter = new PrismaPg(pool)

// ✅ poprawna inicjalizacja PrismaClient
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const password = await bcrypt.hash('password123', 10)

  // USERS
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password,
      role: 'admin',
    },
  })

  const patient = await prisma.user.create({
    data: {
      username: 'patient',
      password,
      role: 'patient',
    },
  })

  const therapist = await prisma.user.create({
    data: {
      username: 'therapist',
      password,
      role: 'therapist',
    },
  })

  console.log('👤 Users created')

  // dzisiejsza data (start dnia)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // SURVEY
  await prisma.survey.create({
    data: {
      title: 'Daily wellbeing survey',
      description: 'Codzienna ankieta samopoczucia',
      date: today,
      active: true,
      createdById: therapist.id,
      questions: {
        create: [
          {
            questionText: 'Jak się dzisiaj czujesz?',
            questionType: 'rating',
            required: true,
            order: 0,
          },
          {
            questionText: 'Jak minął Twój dzień?',
            questionType: 'text',
            required: true,
            order: 1,
          },
          {
            questionText: 'Czy wziąłeś dzisiaj leki?',
            questionType: 'choice',
            required: true,
            order: 2,
            options: {
              create: [
                { text: 'Tak', order: 0 },
                { text: 'Nie', order: 1 },
              ],
            },
          },
          {
            questionText: 'Jeżeli tak – czy wystąpiły efekty uboczne?',
            questionType: 'text',
            required: false,
            order: 3,
          },
          {
            questionText: 'Jeżeli nie – dlaczego nie przyjąłeś leków?',
            questionType: 'text',
            required: false,
            order: 4,
          },
        ],
      },
    },
  })

  console.log('📝 Survey created')
  console.log('✅ Seed completed')
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })

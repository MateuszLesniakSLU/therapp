<template>
  <v-container>
    <h1 class="mb-6">{{ survey?.title }}</h1>

    <v-alert v-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <v-progress-circular
      v-if="loadingSurvey"
      indeterminate
      color="primary"
    />

    <v-form v-if="survey" @submit.prevent="submit" ref="formRef">
      <div
        v-for="question in orderedQuestions"
        :key="question.id"
        class="mb-6"
      >
        <v-text-field
          v-if="isTextVisible(question)"
          v-model="answers[question.id]"
          :label="question.questionText + (question.required ? ' *' : '')"
          :rules="question.required && isTextVisible(question) ? [requiredRule] : []"
        />

        <div v-else-if="question.questionType === 'rating'">
          <div class="d-flex justify-space-between mb-1">
            <span>
              {{ question.questionText }}
              <span v-if="question.required" class="text-error">*</span>
            </span>
            <strong>{{ answers[question.id] ?? '-' }}</strong>
          </div>

          <v-slider
            v-model="answers[question.id]"
            :min="1"
            :max="10"
            step="1"
            show-ticks="always"
            :color="answers[question.id] ? 'primary' : 'grey'"
          />
          <div v-if="question.required && !answers[question.id]" class="text-error text-caption">
            To pole jest wymagane
          </div>
        </div>

        <v-radio-group
          v-else-if="question.questionType === 'choice'"
          v-model="answers[question.id]"
          :label="question.questionText + (question.required ? ' *' : '')"
          :rules="question.required ? [requiredRule] : []"
        >
          <v-radio
            v-for="option in question.options"
            :key="option.id"
            :label="option.text"
            :value="option.text"
          />
        </v-radio-group>
      </div>

      <v-alert v-if="!isFormValid" type="warning" variant="tonal" class="mb-4" density="compact">
        Wypełnij wszystkie wymagane pola oznaczone gwiazdką (*)
      </v-alert>

      <v-btn
        color="primary"
        variant="flat"
        type="submit"
        :loading="submitting"
        :disabled="!isFormValid"
      >
        Zapisz ankietę
      </v-btn>
    </v-form>

    <v-snackbar v-model="showSuccess" color="success">
      Ankieta została zapisana
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getSurveyById,
  submitTodayResponse,
  getMyResponse,
} from '../../services/survey.service'


interface SurveyQuestion {
  id: number
  questionText: string
  questionType: 'text' | 'rating' | 'choice'
  required: boolean
  order: number
  options?: { id: number; text: string }[]
}


const route = useRoute()
const router = useRouter()

const survey = ref<{ id: number; title: string; questions: SurveyQuestion[] } | null>(null)
const answers = ref<Record<number, string | number>>({})

const loadingSurvey = ref(false)
const submitting = ref(false)
const showSuccess = ref(false)
const error = ref<string | null>(null)


const orderedQuestions = computed<SurveyQuestion[]>(() =>
  survey.value
    ? [...survey.value.questions].sort((a, b) => a.order - b.order)
    : [],
)

const medsQuestion = computed<SurveyQuestion | undefined>(() =>
  orderedQuestions.value.find(
    (q: SurveyQuestion) =>
      q.questionType === 'choice' &&
      q.options?.some(o => o.text === 'Tak') &&
      q.options?.some(o => o.text === 'Nie'),
  ),
)

const ifYesQuestion = computed<SurveyQuestion | undefined>(() =>
  orderedQuestions.value.find(q =>
    q.questionText.toLowerCase().includes('jeżeli tak'),
  ),
)

const ifNoQuestion = computed<SurveyQuestion | undefined>(() =>
  orderedQuestions.value.find(q =>
    q.questionText.toLowerCase().includes('jeżeli nie'),
  ),
)

const tookMeds = computed(() =>
  medsQuestion.value ? answers.value[medsQuestion.value.id] : null,
)

/** Reguła walidacji dla wymaganych pól */
const requiredRule = (value: string | number | undefined) => {
  if (value === undefined || value === null || value === '') {
    return 'To pole jest wymagane'
  }
  return true
}

/** Sprawdza czy formularz jest poprawnie wypełniony */
const isFormValid = computed(() => {
  if (!survey.value) return false
  
  for (const question of orderedQuestions.value) {
    if (!question.required) continue
    
    if (question.questionType === 'text') {
      if (ifYesQuestion.value && question.id === ifYesQuestion.value.id && tookMeds.value !== 'Tak') {
        continue
      }
      if (ifNoQuestion.value && question.id === ifNoQuestion.value.id && tookMeds.value !== 'Nie') {
        continue
      }
    }
    
    const answer = answers.value[question.id]
    if (answer === undefined || answer === null || answer === '') {
      return false
    }
  }
  
  return true
})

const isTextVisible = (question: SurveyQuestion) => {
  if (question.questionType !== 'text') return false

  if (ifYesQuestion.value && question.id === ifYesQuestion.value.id) {
    return tookMeds.value === 'Tak'
  }

  if (ifNoQuestion.value && question.id === ifNoQuestion.value.id) {
    return tookMeds.value === 'Nie'
  }

  return true
}


watch(tookMeds, value => {
  if (value === 'Tak' && ifNoQuestion.value) {
    delete answers.value[ifNoQuestion.value.id]
  }
  if (value === 'Nie' && ifYesQuestion.value) {
    delete answers.value[ifYesQuestion.value.id]
  }
})


onMounted(async () => {
  loadingSurvey.value = true
  try {
    const surveyId = Number(route.params.id)
    survey.value = await getSurveyById(surveyId)

    const existingResponse = await getMyResponse(surveyId)
    if (existingResponse) {
      for (const answer of existingResponse.answers) {
        if (answer.question.questionType === 'rating') {
          answers.value[answer.questionId] = answer.answerValue
        } else {
          answers.value[answer.questionId] = answer.answerText || ''
        }
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Nie udało się pobrać ankiety'
  } finally {
    loadingSurvey.value = false
  }
})


const submit = async () => {
  if (!survey.value) return

  submitting.value = true
  error.value = null

  try {
    await submitTodayResponse({
      surveyId: survey.value.id,

      answers: orderedQuestions.value.map(q => ({
        question_id: q.id,
        answer_text:
          q.questionType !== 'rating'
            ? String(answers.value[q.id] ?? '')
            : undefined,
        answer_value:
          q.questionType === 'rating'
            ? Number(answers.value[q.id])
            : undefined,
      })),
    })

    showSuccess.value = true
    setTimeout(() => router.push('/patient/surveys'), 800)
  } catch (e: any) {
    error.value = e.message || 'Nie udało się zapisać ankiety'
  } finally {
    submitting.value = false
  }
}
</script>

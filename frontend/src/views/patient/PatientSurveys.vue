<template>
  <v-container>
    <!-- Nagłówek -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">Ankiety</h1>
      <p class="text-body-2 text-medium-emphasis">Wypełniaj codzienne ankiety i śledź swoją historię</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
    </div>

    <template v-else>
      <!-- SEKCJA: Ankiety do wypełnienia -->
      <v-card class="mb-6 rounded-xl" elevation="0" border>
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="primary">mdi-clipboard-edit</v-icon>
          Dzisiejsze ankiety
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-0">
          <v-list v-if="surveys.length > 0" lines="two">
            <v-list-item
              v-for="survey in surveys"
              :key="survey.id"
              class="px-4 py-3"
            >
              <template v-slot:prepend>
                <v-avatar 
                  :color="statusMap[survey.id] ? 'success' : 'primary'" 
                  size="40"
                  class="mr-3"
                >
                  <v-icon color="white">
                    {{ statusMap[survey.id] ? 'mdi-check' : 'mdi-clipboard-text' }}
                  </v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ survey.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <span v-if="statusMap[survey.id]" class="text-success">
                  Wypełniona {{ formatDateTime(statusMap[survey.id]!) }}
                </span>
                <span v-else class="text-warning">
                  Oczekuje na wypełnienie
                </span>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn
                  color="primary"
                  variant="flat"
                  :to="`/patient/surveys/${survey.id}`"
                >
                  {{ statusMap[survey.id] ? 'Edytuj' : 'Wypełnij' }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
          
          <div v-else class="pa-6 text-center">
            <v-icon icon="mdi-clipboard-check-outline" size="48" color="grey" class="mb-2"></v-icon>
            <p class="text-body-2 text-medium-emphasis">Brak ankiet do wypełnienia</p>
          </div>
        </v-card-text>
      </v-card>

      <!-- SEKCJA: Archiwum odpowiedzi -->
      <v-card class="rounded-xl" elevation="0" border>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div class="d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-history</v-icon>
            Archiwum odpowiedzi
          </div>
          <v-chip size="small" color="primary" variant="tonal">
            {{ responses.length }} {{ responses.length === 1 ? 'wpis' : 'wpisów' }}
          </v-chip>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text v-if="responses.length === 0" class="text-center pa-8">
          <v-icon icon="mdi-inbox-outline" size="64" color="grey" class="mb-4"></v-icon>
          <p class="text-h6 text-medium-emphasis mb-2">Brak historii</p>
          <p class="text-body-2 text-grey">Wypełnione ankiety pojawią się tutaj</p>
        </v-card-text>

        <template v-else>
          <v-row class="pa-4">
            <v-col
              v-for="response in responses"
              :key="response.id"
              cols="12"
              md="6"
            >
              <v-card 
                class="h-100 rounded-lg" 
                :color="getCardColor(response.wellbeingRating)"
                variant="tonal"
              >
                <v-card-title class="d-flex justify-space-between align-center pb-2">
                  <span class="text-body-1 font-weight-bold text-truncate" style="max-width: 70%;">
                    {{ response.survey.title }}
                  </span>
                  <v-chip size="x-small" color="grey" variant="flat">
                    {{ formatDate(response.updatedAt) }}
                  </v-chip>
                </v-card-title>
                
                <v-card-text class="pt-0">
                  <div class="d-flex align-center justify-space-between mb-3" v-if="response.wellbeingRating !== null">
                    <div class="d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-emoticon</v-icon>
                      <span class="text-body-2">Samopoczucie</span>
                    </div>
                    <v-chip 
                      :color="getWellbeingColor(response.wellbeingRating)" 
                      size="small"
                      variant="flat"
                    >
                      {{ response.wellbeingRating }}/10
                    </v-chip>
                  </div>
                  
                  <div class="d-flex align-center justify-space-between mb-3" v-for="boolAns in getBooleanAnswers(response)" :key="boolAns.id">
                    <div class="d-flex align-center">
                      <v-icon size="small" class="mr-1">{{ getQuestionIcon(boolAns.question?.questionText) }}</v-icon>
                      <span class="text-body-2 text-truncate" style="max-width: 150px" :title="boolAns.question?.questionText">
                        {{ boolAns.question?.questionText }}
                      </span>
                    </div>
                    <v-chip 
                      :color="boolAns.answerText === 'Tak' ? 'success' : 'error'" 
                      size="small"
                      variant="flat"
                    >
                      <v-icon size="small" class="mr-1">
                        {{ boolAns.answerText === 'Tak' ? 'mdi-check' : 'mdi-close' }}
                      </v-icon>
                      {{ boolAns.answerText }}
                    </v-chip>
                  </div>
                  
                  <v-expansion-panels variant="accordion" class="mt-2">
                    <v-expansion-panel>
                      <v-expansion-panel-title class="text-caption py-2">
                        <v-icon size="small" class="mr-1">mdi-text</v-icon>
                        Szczegóły odpowiedzi
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <div v-for="answer in getOtherAnswers(response)" :key="answer.id" class="mb-2">
                          <div class="text-caption text-grey-darken-1">{{ answer.question?.questionText }}</div>
                          <div class="text-body-2 font-weight-medium">
                            {{ formatAnswer(answer) }}
                          </div>
                        </div>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-card>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getSurveys } from '../../services/survey.service'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'

/* ---------- types ---------- */

interface Survey {
  id: number
  title: string
  description?: string
  date?: string
}

interface SurveyResponse {
  id: number
  surveyId: number
  updatedAt: string
  wellbeingRating: number
  tookMedication: boolean
  survey: {
    title: string
    date: string
  }
  answers: any[]
}

/* ---------- state ---------- */

const surveys = ref<Survey[]>([])
const responses = ref<SurveyResponse[]>([])
const loading = ref(true)
const statusMap = ref<Record<number, Date>>({})
let pollInterval: any = null

/* ---------- lifecycle ---------- */

const loadData = async (background = false) => {
  if (!background) loading.value = true
  try {
    const [surveyList, statuses] = await Promise.all([
      getSurveys(),
      fetchResponses(),
    ])

    surveys.value = surveyList

    const map: Record<number, Date> = {}
    for (const s of statuses) {
      map[s.surveyId] = new Date(s.updatedAt)
    }
    statusMap.value = map
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  pollInterval = setInterval(() => loadData(true), 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const fetchResponses = async (): Promise<SurveyResponse[]> => {
  try {
    const res = await fetch(`${API_URL}/surveys/my/status`, {
      headers: authHeaders()
    })
    if (res.ok) {
      const data = await res.json()
      responses.value = data
      return data
    }
  } catch (e) {
    console.error(e)
  }
  return []
}

/* ---------- helpers ---------- */

const formatDateTime = (date: Date): string => {
  return date.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
  })
}

const getWellbeingColor = (rating: number | null): string => {
  if (rating === null) return 'grey'
  if (rating >= 7) return 'success'
  if (rating >= 4) return 'warning'
  return 'error'
}

const getCardColor = (rating: number | null): string => {
  if (rating === null) return 'grey'
  if (rating >= 7) return 'success'
  if (rating >= 4) return 'warning'
  return 'error'
}

const formatAnswer = (answer: any): string => {
  if (answer.question?.questionType === 'rating' || answer.question?.questionType === 'number') {
    return answer.answerValue?.toString() || '-'
  }
  return answer.answerText || '-'
}

const isBooleanAnswer = (answer: any) => {
  const text = (answer.answerText || '').toLowerCase()
  return text === 'tak' || text === 'nie'
}

const getQuestionIcon = (text: string = '') => {
  const lower = text.toLowerCase()
  if (lower.includes('lek') || lower.includes('med')) return 'mdi-pill'
  if (lower.includes('sen') || lower.includes('spa') || lower.includes('noc')) return 'mdi-bed'
  if (lower.includes('jedz') || lower.includes('apetyt')) return 'mdi-food'
  return 'mdi-help-circle-outline'
}

const getBooleanAnswers = (response: SurveyResponse) => {
  return response.answers?.filter(isBooleanAnswer) || []
}

const getOtherAnswers = (response: SurveyResponse) => {
  return response.answers?.filter((a: any) => !isBooleanAnswer(a)) || []
}
</script>

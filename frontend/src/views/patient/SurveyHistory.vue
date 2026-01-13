<template>
  <v-container>
    <h1 class="mb-6">Archiwum Ankiet</h1>

    <div v-if="loading" class="d-flex justify-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="responses.length === 0">
      <v-alert type="info" variant="tonal">
        Nie masz jeszcze żadnych wypełnionych ankiet.
      </v-alert>
    </div>

    <v-row v-else>
      <v-col
        v-for="response in responses"
        :key="response.id"
        cols="12"
        md="6"
      >
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex flex-wrap justify-space-between align-center ga-2">
            <span class="text-wrap">{{ response.survey.title }}</span>
            <v-chip size="small" color="grey">{{ formatDate(response.updatedAt) }}</v-chip>
          </v-card-title>
          
          <v-card-text>
            <div class="mb-2">
              <strong>Twoje samopoczucie:</strong> 
              <v-chip :color="getWellbeingColor(response.wellbeingRating)" size="small" class="ml-2">
                {{ response.wellbeingRating }}/10
              </v-chip>
            </div>
            <div class="mb-2">
              <strong>Leki:</strong> 
              <v-icon :color="response.tookMedication ? 'success' : 'error'" class="ml-2">
                {{ response.tookMedication ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
            </div>
            
            <v-divider class="my-3"></v-divider>
            
            <v-expansion-panels variant="accordion">
              <v-expansion-panel title="Szczegóły odpowiedzi">
                <v-expansion-panel-text>
                  <div v-for="answer in response.answers" :key="answer.id" class="mb-3">
                    <div class="text-caption text-grey">{{ answer.question.questionText }}</div>
                    <div class="font-weight-medium">
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'

interface SurveyResponse {
  id: number
  updatedAt: string
  wellbeingRating: number
  tookMedication: boolean
  survey: {
    title: string
    date: string
  }
  answers: any[]
}

const responses = ref<SurveyResponse[]>([])
const loading = ref(true)

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

const getWellbeingColor = (rating: number) => {
  if (rating >= 7) return 'success'
  if (rating >= 4) return 'warning'
  return 'error'
}

const formatAnswer = (answer: any) => {
  if (answer.question.questionType === 'rating' || answer.question.questionType === 'number') {
    return answer.answerValue
  }
  return answer.answerText || '-'
}

const fetchHistory = async () => {
    loading.value = true
    try {
        const res = await fetch(`${API_URL}/surveys/my/status`, {
            headers: authHeaders()
        })
        if (res.ok) {
            responses.value = await res.json()
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchHistory()
})
</script>

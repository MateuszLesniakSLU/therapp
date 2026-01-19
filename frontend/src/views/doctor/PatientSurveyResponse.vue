<template>
  <v-container>
    <div class="d-flex align-center justify-center mb-6 position-relative" style="width: 100%">
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" style="position: absolute; left: 0"></v-btn>
      <h1>Odpowiedzi Pacjenta</h1>
    </div>

    <div v-if="loading" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <div v-else-if="response">
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4 pb-4">
            <v-card-title>{{ response.survey?.title || 'Ankieta' }}</v-card-title>
            <v-card-subtitle>
              Data wypełnienia: {{ formatDate(response.updatedAt) }}
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card color="primary" variant="tonal" class="pa-4">
            <div class="text-h6 mb-2">Samopoczucie</div>
            <div class="text-h3 font-weight-bold">
              {{ response.wellbeingRating ?? '-' }}/10
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card :color="response.tookMedication ? 'success' : 'warning'" variant="tonal" class="pa-4">
            <div class="text-h6 mb-2">Leki</div>
            <div class="text-h3 font-weight-bold d-flex align-center">
              <v-icon size="40" class="mr-2">
                {{ response.tookMedication ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
              {{ response.tookMedication ? 'Przyjęte' : 'Nie przyjęte' }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4 mb-16">
        <v-col cols="12">
          <v-card title="Szczegóły odpowiedzi" class="pb-10">
            <v-list>
              <v-list-item v-for="answer in response.answers" :key="answer.id" lines="two">
                <v-list-item-title class="font-weight-bold">
                  {{ answer.question?.questionText }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-1 mt-1">
                  {{ formatAnswer(answer) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-alert v-else type="info">
      Brak danych ankiety.
    </v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'

const route = useRoute()
const router = useRouter()

const patientId = Number(route.params.patientId)
const surveyId = Number(route.params.surveyId)

const response = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const goBack = () => {
  router.push(`/doctor/patients/${patientId}`)
}

const fetchResponse = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(`${API_URL}/surveys/${surveyId}/responses?userId=${patientId}`, {
      headers: authHeaders()
    })
    if (!res.ok) {
      throw new Error('Nie udało się pobrać odpowiedzi')
    }
    const data = await res.json()
    response.value = data.find((r: any) => r.userId === patientId) || data[0] || null
  } catch (e: any) {
    error.value = e.message || 'Błąd ładowania danych'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatAnswer = (answer: any) => {
  if (answer.question?.questionType === 'rating') {
    return answer.answerValue ? `${answer.answerValue}/10` : '-'
  }
  return answer.answerText || '-'
}

onMounted(() => {
  fetchResponse()
})
</script>

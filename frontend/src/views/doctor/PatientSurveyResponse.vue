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
        <v-col cols="12" :md="booleanAnswers.length > 0 ? 6 : 12">
          <v-card color="primary" variant="tonal" class="pa-4 h-100">
            <div class="text-h6 mb-2">Samopoczucie</div>
            <div class="text-h3 font-weight-bold">
              {{ response.wellbeingRating ?? '-' }}/10
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" v-if="booleanAnswers.length > 0">
           <v-card v-for="boolAns in booleanAnswers" :key="boolAns.id" :color="boolAns.answerText === 'Tak' ? 'success' : 'warning'" variant="tonal" class="pa-4 mb-2">
             <div class="text-subtitle-2 mb-1 d-flex align-center">
               <v-icon size="small" class="mr-1">{{ getQuestionIcon(boolAns.question?.questionText) }}</v-icon>
               {{ boolAns.question?.questionText }}
             </div>
             <div class="text-h5 font-weight-bold d-flex align-center">
               <v-icon size="32" class="mr-2">
                 {{ boolAns.answerText === 'Tak' ? 'mdi-check-circle' : 'mdi-close-circle' }}
               </v-icon>
               {{ boolAns.answerText }}
             </div>
           </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4 mb-16">
        <v-col cols="12">
          <v-card title="Szczegóły odpowiedzi" class="pb-10">
            <v-list>
              <v-list-item v-for="answer in otherAnswers" :key="answer.id" lines="two">
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
import { ref, onMounted, computed } from 'vue'
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

const getQuestionIcon = (text: string = '') => {
  const lower = text.toLowerCase()
  if (lower.includes('lek') || lower.includes('med')) return 'mdi-pill'
  if (lower.includes('sen') || lower.includes('spa') || lower.includes('noc')) return 'mdi-bed'
  if (lower.includes('jedz') || lower.includes('apetyt')) return 'mdi-food'
  return 'mdi-help-circle-outline'
}

const booleanAnswers = computed(() => {
   if (!response.value) return []
   return response.value.answers?.filter((a: any) => {
     const text = (a.answerText || '').toLowerCase()
     return text === 'tak' || text === 'nie'
   }) || []
})

const otherAnswers = computed(() => {
   if (!response.value) return []
   return response.value.answers?.filter((a: any) => {
     const text = (a.answerText || '').toLowerCase()
     return text !== 'tak' && text !== 'nie'
   }) || []
})

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

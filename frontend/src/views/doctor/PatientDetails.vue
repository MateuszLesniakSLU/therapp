<template>
  <v-container>
    <div class="d-flex align-center justify-center mb-6 position-relative" style="width: 100%">
      <v-btn icon="mdi-arrow-left" variant="text" to="/doctor/patients" style="position: absolute; left: 0"></v-btn>
      <h1>Szczegóły Pacjenta</h1>
    </div>

    <div class="mb-4">
      <v-btn-toggle v-model="days" mandatory color="primary" @update:model-value="fetchStats">
        <v-btn :value="7">7 Dni</v-btn>
        <v-btn :value="14">14 Dni</v-btn>
        <v-btn :value="30">30 Dni</v-btn>
        <v-btn :value="365">Rok</v-btn>
      </v-btn-toggle>
    </div>

    <v-row v-if="stats">
      <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal">
          <v-card-title>Wypełnione Ankiety</v-card-title>
          <v-card-text class="text-h4">
            {{ stats!.total }} / {{ stats!.period }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card color="secondary" variant="tonal">
          <v-card-title>Średnie Samopoczucie</v-card-title>
          <v-card-text class="text-h4">
            {{ formatNum(stats!.avgWellbeing) }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card :color="completionRate < 50 ? 'error' : 'success'" variant="tonal">
          <v-card-title>Wskaźnik Wypełnień</v-card-title>
          <v-card-text class="text-h4">
            {{ formatNum(completionRate) }}%
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6" v-if="stats">
      <v-col cols="12" md="8">
        <v-card title="Historia Samopoczucia">
          <v-list lines="one" density="compact">
            <v-list-item 
              v-for="resp in (stats?.responses || [])" 
              :key="resp.date"
              @click="resp.surveyId ? viewSurveyResponse(resp.surveyId) : null"
              :class="{ 'cursor-pointer': resp.surveyId }"
            >
              <template v-slot:prepend>
                <v-icon :color="getMoodColor(resp.wellbeing)">
                  mdi-circle
                </v-icon>
              </template>
              <v-list-item-title>
                {{ formatDate(resp.date) }} - Ocena: {{ resp.wellbeing }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Leki: {{ resp.medication ? 'Tak' : 'Nie' }}
              </v-list-item-subtitle>
              <template v-slot:append v-if="resp.surveyId">
                <v-icon size="small" color="grey">mdi-chevron-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card title="Brakujące Dni" color="error" variant="outlined">
          <v-card-text v-if="(stats?.missingDates || []).length === 0">
            Brak pominiętych dni!
          </v-card-text>
          <v-list v-else density="compact">
            <v-list-item v-for="date in (stats?.missingDates || [])" :key="date">
              <v-list-item-title>{{ date }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPatientStats, type PatientStats } from '../../services/therapist.service'

const route = useRoute()
const router = useRouter()
const stats = ref<PatientStats | null>(null)
const days = ref(30)
const loading = ref(false)

const patientId = computed(() => Number(route.params.patientId))

const completionRate = computed(() => {
  if (!stats.value) return 0
  if (stats.value.period === 0) return 0
  return (stats.value.total / stats.value.period) * 100
})

const fetchStats = async () => {
  loading.value = true
  try {
    stats.value = await getPatientStats(patientId.value, days.value)
  } catch {
    stats.value = null
  } finally {
    loading.value = false
  }
}

const formatNum = (num: number) => num.toFixed(1)
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pl-PL')

const getMoodColor = (rating: number) => {
  if (rating >= 8) return 'green'
  if (rating >= 4) return 'orange'
  return 'red'
}

const viewSurveyResponse = (surveyId: number) => {
  // Navigate to survey response view for this patient
  router.push(`/doctor/patients/${patientId.value}/survey/${surveyId}`)
}

onMounted(() => {
  fetchStats()
})
</script>

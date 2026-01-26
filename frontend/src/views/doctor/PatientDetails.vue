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
        <v-card class="pa-4 rounded-xl" border elevation="0">
             <div class="d-flex align-center">
                <v-avatar color="primary-lighten-4" class="mr-3" rounded="lg"><v-icon color="primary">mdi-clipboard-list</v-icon></v-avatar>
                <div>
                   <div class="text-caption font-weight-bold text-medium-emphasis">WYPEŁNIONE ANKIETY</div>
                   <div class="text-h5 font-weight-black">{{ stats.total }} / {{ stats.period }}</div>
                </div>
             </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl" border elevation="0">
             <div class="d-flex align-center">
                <v-avatar color="secondary-lighten-4" class="mr-3" rounded="lg"><v-icon color="secondary">mdi-emoticon-outline</v-icon></v-avatar>
                <div>
                   <div class="text-caption font-weight-bold text-medium-emphasis">ŚREDNIE SAMOPOCZUCIE</div>
                   <div class="text-h5 font-weight-black">{{ formatNum(stats.avgWellbeing) }}</div>
                </div>
             </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl" border elevation="0">
             <div class="d-flex align-center">
                <v-avatar :color="completionRate < 50 ? 'error-lighten-4' : 'success-lighten-4'" class="mr-3" rounded="lg">
                   <v-icon :color="completionRate < 50 ? 'error' : 'success'">mdi-chart-pie</v-icon>
                </v-avatar>
                <div>
                   <div class="text-caption font-weight-bold text-medium-emphasis">WSKAŹNIK WYPEŁNIEŃ</div>
                   <div class="text-h5 font-weight-black">{{ formatNum(completionRate) }}%</div>
                </div>
             </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-4 pa-4 rounded-xl" border elevation="0" v-if="stats && stats.responses.length > 0">
       <div class="text-subtitle-1 font-weight-bold mb-2">Historia Samopoczucia</div>
       <div style="height: 220px">
          <MoodChart 
             :labels="stats.responses.map(r => formatDateShort(r.date))"
             :data="stats.responses.map(r => r.wellbeing)"
             gradient-start="rgba(25, 118, 210, 0.2)"
             border-color="#1976D2"
             :height="220"
          />
       </div>
    </v-card>

    <v-row class="mt-4" v-if="stats">
      <v-col cols="12" md="8">
        <v-card title="Historia Samopoczucia">
          <v-list lines="one" density="compact" style="max-height: 300px; overflow-y: auto">
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
              <v-list-item-subtitle v-if="resp.medication !== null">
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
import MoodChart from '../../components/MoodChart.vue'

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
const formatDateShort = (dateStr: string) => new Date(dateStr).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })

const getMoodColor = (rating: number) => {
  if (rating >= 8) return 'green'
  if (rating >= 4) return 'orange'
  return 'red'
}

const viewSurveyResponse = (surveyId: number) => {
  router.push(`/doctor/patients/${patientId.value}/survey/${surveyId}`)
}

onMounted(() => {
  fetchStats()
})
</script>

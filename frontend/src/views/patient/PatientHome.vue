<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <h1 class="text-h4 font-weight-bold mb-4">Witaj, {{ user?.first_name || 'Pacjencie' }}!</h1>
        <p class="text-subtitle-1 mb-6 text-grey-darken-1">
          Miło Cię widzieć. Oto Twoje centrum zdrowia psychicznego.
        </p>
      </v-col>
    </v-row>

    <v-row>
      <!-- Status Ankiety -->
      <v-col cols="12" md="8">
        <v-card
          :color="todaySurveyCompleted ? 'success-lighten-4' : 'primary-lighten-4'"
          class="pa-4 mb-6 rounded-xl border-0"
          elevation="0"
        >
          <div class="d-flex flex-column flex-sm-row align-center justify-space-between">
            <div class="mb-3 mb-sm-0">
              <div class="text-h6 font-weight-bold mb-1">
                {{ todaySurveyCompleted ? 'Ankieta na dziś wypełniona!' : 'Ankieta na dziś czeka' }}
              </div>
              <div class="text-body-2">
                {{ todaySurveyCompleted ? 'Świetna robota! Wróć jutro.' : 'Poświęć chwilę na ocenę swojego samopoczucia.' }}
              </div>
            </div>
            
            <v-btn
              v-if="!todaySurveyCompleted"
              color="primary"
              variant="flat"
              prepend-icon="mdi-clipboard-check"
              to="/patient/surveys"
              size="large"
              rounded="lg"
              elevation="2"
            >
              Wypełnij teraz
            </v-btn>
            <v-icon
              v-else
              icon="mdi-check-circle"
              color="success"
              size="64"
            ></v-icon>
          </div>
        </v-card>

        <v-card class="pa-6 mb-6 rounded-xl" elevation="0" border v-if="chartData.length > 0">
           <div class="d-flex align-center justify-space-between mb-4">
             <div>
               <div class="text-caption text-medium-emphasis font-weight-bold">TWOJE SAMOPOCZUCIE</div>
               <div class="text-h5 font-weight-black">Ostatnie 7 dni</div>
             </div>
             <v-chip color="primary" size="small" variant="flat" label>
                Średnia: {{ (chartData.reduce((a, b) => a + b, 0) / chartData.length).toFixed(1) }}
             </v-chip>
           </div>
           <div style="height: 200px">
              <MoodChart 
                :labels="chartLabels" 
                :data="chartData" 
                gradient-start="rgba(25, 118, 210, 0.4)"
                border-color="#1976D2"
                :height="200"
              />
           </div>
        </v-card>

      </v-col>

      <v-col cols="12" md="4">
        <v-card title="Szybkie akcje" class="mb-6 rounded-xl" elevation="0" border>
          <v-list>
            <v-list-item
              to="/patient/history"
              prepend-icon="mdi-history"
              title="Twoja historia"
              subtitle="Zobacz poprzednie ankiety"
              rounded="lg"
              class="mb-2"
            ></v-list-item>
             <v-list-item
              to="/patient/doctors"
              prepend-icon="mdi-doctor"
              title="Moi specjaliści"
              subtitle="Zarządzaj połączeniami"
              rounded="lg"
            ></v-list-item>
          </v-list>
        </v-card>

        <v-card class="pa-6 quote-card rounded-xl" elevation="2">
            <v-icon icon="mdi-format-quote-open" size="48" color="primary" class="mb-2 opacity-50"></v-icon>
            <blockquote class="text-h6 font-italic font-weight-light mb-4 text-center">
              "{{ quote?.text }}"
            </blockquote>
            <div class="text-right text-subtitle-2 font-weight-bold text-medium-emphasis">
              — {{ quote?.author }}
            </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'
import MoodChart from '../../components/MoodChart.vue'

const auth = useAuthStore()
const user = computed(() => auth.user)

const todaySurveyCompleted = ref(false)
const loading = ref(true)
const chartLabels = ref<string[]>([])
const chartData = ref<number[]>([])

const quotes = [
  { text: "Każdy dzień to nowa szansa, aby zmienić swoje życie.", author: "Nieznany" },
  { text: "Nie musisz być wielki, aby zacząć, ale musisz zacząć, aby być wielkim.", author: "Zig Ziglar" },
  { text: "Twoje zdrowie psychiczne jest priorytetem. Twoje szczęście jest ważne. Twoja dbałość o siebie jest koniecznością.", author: "Nieznany" },
  { text: "Bądź zmianą, którą chcesz ujrzeć w świecie.", author: "Mahatma Gandhi" },
  { text: "Najlepszym sposobem na przewidzenie przyszłości jest jej kreowanie.", author: "Peter Drucker" }
];

const quote = ref(quotes[Math.floor(Math.random() * quotes.length)]);

const checkSurveyStatus = async () => {
  try {
    const res = await fetch(`${API_URL}/surveys/my/status`, {
      headers: authHeaders()
    })
    
    if (res.ok) {
        const data = await res.json()
        const today = new Date().toISOString().split('T')[0]
        const completed = data.some((r: any) => {
            const rDate = new Date(r.updatedAt).toISOString().split('T')[0]
            return rDate === today
        })
        todaySurveyCompleted.value = completed

        const rated = data.filter((r: any) => r.wellbeingRating !== null)
        const last7 = rated.slice(0, 7).reverse()
        
        chartLabels.value = last7.map((r: any) => new Date(r.updatedAt).toLocaleDateString('pl-PL', { weekday: 'short' }))
        chartData.value = last7.map((r: any) => r.wellbeingRating)
    }
  } catch (e) {
    console.error('Failed to check survey status', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkSurveyStatus()
})
</script>

<style scoped>
.quote-card {
    border-left: 4px solid #1976D2;
}
</style>

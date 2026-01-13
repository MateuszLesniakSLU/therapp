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
          class="pa-4 mb-6"
          elevation="2"
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
            >
              Wypełnij teraz
            </v-btn>
            <v-icon
              v-else
              icon="mdi-check-decagram"
              color="success"
              size="64"
            ></v-icon>
          </div>
        </v-card>

        <!-- Cytat Dnia -->
        <v-card class="pa-6 mt-6 quote-card" elevation="2">
            <v-icon icon="mdi-format-quote-open" size="48" color="primary" class="mb-2 opacity-50"></v-icon>
            <blockquote class="text-h5 font-italic font-weight-light mb-4 text-center">
              "{{ quote.text }}"
            </blockquote>
            <div class="text-right text-subtitle-2 font-weight-bold text-grey-darken-2">
              — {{ quote.author }}
            </div>
        </v-card>
      </v-col>

      <!-- Szybkie Akcje -->
      <v-col cols="12" md="4">
        <v-card title="Szybkie akcje" class="h-100">
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.store'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'

const auth = useAuthStore()
const user = computed(() => auth.user)

const todaySurveyCompleted = ref(false)
const loading = ref(true)

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
        // Check if any response is from today
        const today = new Date().toISOString().split('T')[0]
        const completed = data.some((r: any) => {
            const rDate = new Date(r.updatedAt).toISOString().split('T')[0]
            return rDate === today
        })
        todaySurveyCompleted.value = completed
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
.success-lighten-4 {
    background-color: #E8F5E9;
}
.primary-lighten-4 {
    background-color: #E3F2FD;
}
.quote-card {
    background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
    border-left: 4px solid #1976D2;
}
</style>

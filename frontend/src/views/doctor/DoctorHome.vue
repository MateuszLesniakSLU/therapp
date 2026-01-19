<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Panel Terapeuty</h1>
        <p class="text-subtitle-1 text-grey darken-1 mb-6">Przegląd Twoich pacjentów i ich aktualnego stanu.</p>
      </v-col>
    </v-row>

    <div v-if="loading" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-row v-else>
      <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal" class="pa-4 h-100">
          <div class="text-h2 font-weight-bold mb-1">{{ stats.totalPatients }}</div>
          <div class="text-subtitle-1 font-weight-medium">Twoich Pacjentów</div>
        </v-card>
      </v-col>
       <v-col cols="12" md="4">
        <v-card color="error" variant="tonal" class="pa-4 h-100">
          <div class="text-h2 font-weight-bold mb-1">{{ stats.lowWellbeing.length }}</div>
          <div class="text-subtitle-1 font-weight-medium">Niskie Samopoczucie</div>
          <div class="text-caption">Średnia < 4 w ostatnich 7 dniach</div>
        </v-card>
      </v-col>
       <v-col cols="12" md="4">
        <v-card color="warning" variant="tonal" class="pa-4 h-100">
          <div class="text-h2 font-weight-bold mb-1">{{ stats.missingSurveys.length }}</div>
          <div class="text-subtitle-1 font-weight-medium">Brakujące Ankiety</div>
          <div class="text-caption">Brak odpowiedzi od > 2 dni</div>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-6" v-if="!loading">
        <!-- Wymagają Uwagi (Samopoczucie) -->
        <v-col cols="12" md="6">
            <v-card title="Wymagają Uwagi (Samopoczucie)" elevation="2" class="h-100">
                <v-list v-if="stats.lowWellbeing.length > 0">
                    <v-list-item
                        v-for="p in stats.lowWellbeing"
                        :key="p.id"
                        :to="`/doctor/patients/${p.id}`"
                        prepend-icon="mdi-alert-circle"
                        class="text-error"
                    >
                        <v-list-item-title class="font-weight-bold">
                            {{ p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.email }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            Średnia: {{ p.avgWellbeing.toFixed(1) }}/10
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
                <div v-else class="pa-4 text-center text-grey">
                    Brak pacjentów z alarmująco niskim samopoczuciem.
                </div>
            </v-card>
        </v-col>

        <!-- Brak Aktywności -->
        <v-col cols="12" md="6">
            <v-card title="Brak Aktywności" elevation="2" class="h-100">
                <v-list v-if="stats.missingSurveys.length > 0">
                    <v-list-item
                        v-for="p in stats.missingSurveys"
                        :key="p.id"
                        :to="`/doctor/patients/${p.id}`"
                        prepend-icon="mdi-clock-alert"
                        class="text-warning"
                    >
                        <v-list-item-title class="font-weight-bold">
                            {{ p.first_name && p.last_name ? `${p.first_name} ${p.last_name}` : p.email }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            Dni bez ankiety: {{ p.daysSinceLast }}
                        </v-list-item-subtitle>
                    </v-list-item>
                </v-list>
                <div v-else class="pa-4 text-center text-grey">
                    Wszyscy pacjenci wypełniają ankiety na bieżąco.
                </div>
            </v-card>
        </v-col>
    </v-row>

  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'

const stats = ref({
    totalPatients: 0,
    lowWellbeing: [] as any[],
    missingSurveys: [] as any[]
})
const loading = ref(true)

const fetchStats = async () => {
    try {
        const res = await fetch(`${API_URL}/surveys/dashboard-stats`, {
             headers: authHeaders()
        })
        if (res.ok) {
            stats.value = await res.json()
        }
    } catch (e) {
        console.error('Failed to fetch dashboard stats', e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchStats()
})
</script>

<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4">Zarządzanie Ankietami</h1>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" to="/doctor/surveys/new">
        Nowa Ankieta
      </v-btn>
    </div>

    <v-progress-circular v-if="loading" indeterminate color="primary"></v-progress-circular>

    <div v-else>
      <v-row v-if="surveys.length > 0">
        <v-col
          v-for="survey in surveys"
          :key="survey.id"
          cols="12"
          md="6"
        >
          <v-card class="h-100 rounded-lg" elevation="2">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>{{ survey.title }}</span>
              <v-chip size="small" :color="survey.active ? 'success' : 'grey'">
                {{ survey.active ? 'Aktywna' : 'Nieaktywna' }}
              </v-chip>
            </v-card-title>
            <v-card-subtitle class="mb-2">
              Utworzono: {{ new Date(survey.createdAt).toLocaleDateString() }}
            </v-card-subtitle>
            <v-card-text>
               <p v-if="survey.description" class="text-body-2 mb-2">{{ survey.description }}</p>
               <div class="text-caption text-medium-emphasis">
                 Liczba pytań: {{ survey.questions?.length || 0 }}
               </div>
            </v-card-text>
            <v-card-actions>
              <v-btn
                 variant="flat"
                 color="error"
                 size="small"
                 @click="confirmDelete(survey)"
                 class="mr-2"
              >
                Usuń
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                 variant="flat"
                 :color="survey.active ? 'warning' : 'success'"
                 size="small"
                 class="text-white"
                 @click="confirmStatusChange(survey)"
              >
                {{ survey.active ? 'Dezaktywuj' : 'Aktywuj' }}
              </v-btn>
              <v-btn variant="flat" color="primary" size="small" :to="`/doctor/surveys/${survey.id}`">
                Szczegóły
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-alert v-else type="info" variant="tonal" class="mt-4">
        Nie utworzyłeś jeszcze żadnych ankiet.
      </v-alert>
    </div>

    <v-dialog v-model="statusDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ statusDialog.newStatus ? 'Aktywuj' : 'Dezaktywuj' }} ankietę</v-card-title>
        <v-card-text>
          Czy na pewno chcesz zmienić status ankiety <strong>{{ statusDialog.survey?.title }}</strong> na
          <strong>{{ statusDialog.newStatus ? 'Aktywną' : 'Nieaktywną' }}</strong>?
        </v-card-text>
        <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn color="grey" variant="text" @click="statusDialog.show = false">Anuluj</v-btn>
           <v-btn :color="statusDialog.newStatus ? 'success' : 'warning'" variant="flat" :loading="statusDialog.loading" @click="executeStatusChange">
             {{ statusDialog.newStatus ? 'Aktywuj' : 'Dezaktywuj' }}
           </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Usuń ankietę</v-card-title>
        <v-card-text>
          Czy na pewno chcesz usunąć ankietę <strong>{{ deleteDialog.survey?.title }}</strong>?
          <br><br>
          <small class="text-grey">Ankieta zostanie trwale ukryta dla Ciebie i pacjentów.</small>
        </v-card-text>
        <v-card-actions>
           <v-spacer></v-spacer>
           <v-btn color="grey" variant="text" @click="deleteDialog.show = false">Anuluj</v-btn>
           <v-btn color="error" variant="flat" :loading="deleteDialog.loading" @click="executeDelete">Usuń</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { getAllSurveys, setSurveyStatus, deleteSurvey } from '../../services/survey.service'

const surveys = ref<any[]>([])
const loading = ref(true)
let pollInterval: any = null

const statusDialog = reactive({
  show: false,
  survey: null as any,
  loading: false,
  newStatus: false
})

const deleteDialog = reactive({
  show: false,
  survey: null as any,
  loading: false
})

const fetchSurveys = async (background = false) => {
  if (!background) loading.value = true
  try {
    surveys.value = await getAllSurveys()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const confirmStatusChange = (survey: any) => {
  statusDialog.survey = survey
  statusDialog.newStatus = !survey.active
  statusDialog.show = true
}

const executeStatusChange = async () => {
  if (!statusDialog.survey) return
  statusDialog.loading = true
  try {
    await setSurveyStatus(statusDialog.survey.id, statusDialog.newStatus)
    await fetchSurveys(true)
    statusDialog.show = false
  } catch (e) {
    console.error(e)
    alert('Błąd zmiany statusu')
  } finally {
    statusDialog.loading = false
  }
}

const confirmDelete = (survey: any) => {
  deleteDialog.survey = survey
  deleteDialog.show = true
}

const executeDelete = async () => {
  if (!deleteDialog.survey) return
  deleteDialog.loading = true
  try {
    await deleteSurvey(deleteDialog.survey.id)
    await fetchSurveys(true)
    deleteDialog.show = false
  } catch (e) {
    console.error(e)
    alert('Błąd usuwania ankiety')
  } finally {
    deleteDialog.loading = false
  }
}

onMounted(() => {
  fetchSurveys()
  pollInterval = setInterval(() => fetchSurveys(true), 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

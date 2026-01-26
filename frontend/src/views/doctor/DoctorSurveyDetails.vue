<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center">
        <v-btn icon="mdi-arrow-left" variant="text" to="/doctor/surveys" class="mr-4"></v-btn>
        <div>
           <div class="text-caption text-medium-emphasis">SZCZEGÓŁY ANKIETY</div>
           <h1 class="text-h4">{{ survey?.title }}</h1>
        </div>
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="survey">
      <!-- Opis -->
      <v-card v-if="survey.description" class="mb-6 pa-4 border-thin" variant="text">
         {{ survey.description }}
      </v-card>

      <!-- Statystyki -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-card class="pa-4" color="primary" variant="tonal">
            <div class="text-subtitle-2 mb-1">WYPEŁNIONO DZISIAJ</div>
            <div class="text-h4 font-weight-bold">
              {{ todayCount }} / {{ totalAssigned }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
           <v-card class="pa-4" variant="outlined">
             <div class="text-subtitle-2 mb-1">WSKAŹNIK ODPOWIEDZI</div>
             <div class="text-h4 font-weight-bold">
               {{ totalAssigned > 0 ? Math.round((todayCount / totalAssigned) * 100) : 0 }}%
             </div>
           </v-card>
        </v-col>
      </v-row>

      <!-- Tabela pacjentów -->
      <v-card title="Przypisani Pacjenci">
        <template v-slot:append>
          <v-btn color="primary" variant="text" prepend-icon="mdi-pencil" @click="openAssignmentDialog">
            Edytuj przypisania
          </v-btn>
        </template>

        <v-data-table
          :headers="headers"
          :items="patientStats"
          hover
          items-per-page-text="Elementów na stronę:"
          page-text="{0}-{1} z {2}"
          no-data-text="Brak przypisanych pacjentów"
          :items-per-page="10"
        >
          <template v-slot:item.user="{ item }">
            <div class="font-weight-medium">
              {{ item.user.first_name }} {{ item.user.last_name }}
              <span v-if="!item.user.first_name && !item.user.last_name" class="font-italic text-grey-darken-1">
                (Brak imienia i nazwiska)
              </span>
            </div>
            <div class="text-caption text-medium-emphasis">{{ item.user.email }}</div>
          </template>

          <template v-slot:item.hasCompletedToday="{ item }">
            <v-chip
              :color="item.hasCompletedToday ? 'success' : 'grey'"
              size="small"
              variant="flat"
            >
              {{ item.hasCompletedToday ? 'Wypełniono' : 'Oczekuje' }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              v-if="item.hasCompletedToday"
              size="small"
              color="primary"
              variant="text"
              prepend-icon="mdi-eye"
              :to="`/doctor/patients/${item.user.id}/survey/${survey.id}`"
            >
              Zobacz
            </v-btn>
            <span v-else class="text-caption text-disabled font-italic">Brak odpowiedzi</span>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Dialog edycji przypisań -->
    <v-dialog v-model="assignmentDialog" max-width="500" scrollable>
      <v-card>
        <v-card-title>Edytuj przypisania</v-card-title>
        <v-card-text style="height: 400px; padding: 0">
           <div class="pa-4 pb-0">
             <v-text-field
               v-model="searchPatient"
               label="Szukaj pacjenta"
               prepend-inner-icon="mdi-magnify"
               variant="outlined"
               density="compact"
               hide-details
               class="mb-2"
               placeholder="Imię, nazwisko lub email"
             ></v-text-field>
           </div>
           
           <v-list density="compact" select-strategy="leaf">
             <v-list-item
               v-for="patient in filteredAllPatients"
               :key="patient.id"
               @click="togglePatient(patient.id)"
             >
               <template v-slot:prepend>
                 <v-checkbox-btn :model-value="selectedPatients.includes(patient.id)"></v-checkbox-btn>
               </template>
               <v-list-item-title>
                 {{ patient.first_name }} {{ patient.last_name }}
                 <span v-if="!patient.first_name && !patient.last_name" class="font-italic text-grey">(Brak nazwy)</span>
               </v-list-item-title>
               <v-list-item-subtitle>{{ patient.email }}</v-list-item-subtitle>
             </v-list-item>
             
             <div v-if="filteredAllPatients.length === 0" class="text-center pa-4 text-grey">
               Nie znaleziono pacjentów.
             </div>
           </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <div class="text-caption text-medium-emphasis ml-2">Wybrano: {{ selectedPatients.length }}</div>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="assignmentDialog = false">Anuluj</v-btn>
          <v-btn color="primary" variant="flat" @click="saveAssignments" :loading="savingAssignments">Zapisz</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getSurveyDetails, updateSurveyAssignments } from '../../services/survey.service'
import { getMyPatients } from '../../services/therapist.service'

const route = useRoute()
const surveyId = Number(route.params.id)

const loading = ref(true)
const error = ref<string | null>(null)

const survey = ref<any>(null)
const patientStats = ref<any[]>([])
const todayCount = ref(0)
const totalAssigned = ref(0)

// Dialog variables
const assignmentDialog = ref(false)
const allPatients = ref<any[]>([])
const selectedPatients = ref<number[]>([])
const searchPatient = ref('')
const savingAssignments = ref(false)

const headers = [
  { title: 'Pacjent', key: 'user', align: 'start' },
  { title: 'Status (Dzisiaj)', key: 'hasCompletedToday', align: 'center' },
  { title: 'Akcja', key: 'actions', align: 'end', sortable: false },
] as const

const filteredAllPatients = computed(() => {
  if (!searchPatient.value) return allPatients.value
  const q = searchPatient.value.toLowerCase()
  return allPatients.value.filter(p => 
    p.email.toLowerCase().includes(q) || 
    (p.first_name && p.first_name.toLowerCase().includes(q)) ||
    (p.last_name && p.last_name.toLowerCase().includes(q))
  )
})


const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await getSurveyDetails(surveyId)
    survey.value = data.survey
    patientStats.value = data.patientStats
    todayCount.value = data.todayCount
    totalAssigned.value = data.totalAssigned
  } catch (e: any) {
    error.value = e.message || 'Błąd pobierania danych'
  } finally {
    loading.value = false
  }
}

const openAssignmentDialog = async () => {
   try {
     if (allPatients.value.length === 0) {
        allPatients.value = await getMyPatients()
     }
     selectedPatients.value = patientStats.value.map(s => s.user.id)
     assignmentDialog.value = true
   } catch (e) {
     console.error(e)
   }
}

const togglePatient = (id: number) => {
  const idx = selectedPatients.value.indexOf(id)
  if (idx === -1) selectedPatients.value.push(id)
  else selectedPatients.value.splice(idx, 1)
}

const saveAssignments = async () => {
  savingAssignments.value = true
  try {
    await updateSurveyAssignments(surveyId, selectedPatients.value)
    assignmentDialog.value = false
    await fetchData() // Refresh data
  } catch (e: any) {
    console.error(e)
    alert(e.message || 'Błąd zapisu')
  } finally {
    savingAssignments.value = false
  }
}


onMounted(() => {
  fetchData()
})
</script>

<template>
  <v-container>
    <div class="d-flex align-center mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" to="/doctor/surveys" class="mr-4"></v-btn>
      <h1 class="text-h4">Nowa Ankieta</h1>
    </div>

    <v-form ref="form" @submit.prevent="submitSurvey">
      <v-row>
        <!-- LEWA KOLUMNA: Szcegóły ankiety i pytania -->
        <v-col cols="12" md="8">
          <v-card class="mb-6 rounded-lg pa-4">
            <v-card-title>Szczegóły Ankiety</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="survey.title"
                label="Tytuł ankiety"
                :rules="[v => !!v || 'Tytuł jest wymagany']"
                required
                variant="outlined"
              ></v-text-field>
              <v-textarea
                v-model="survey.description"
                label="Opis (opcjonalnie)"
                variant="outlined"
                rows="3"
              ></v-textarea>
            </v-card-text>
          </v-card>

          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h5">Pytania</h2>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn color="primary" variant="flat" v-bind="props" prepend-icon="mdi-plus">
                  Dodaj Pytanie
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="addQuestion('text')" title="Tekstowe" prepend-icon="mdi-text-short"></v-list-item>
                <v-list-item @click="addQuestion('rating')" title="Ocena (1-10)" prepend-icon="mdi-star"></v-list-item>
                <v-list-item @click="addQuestion('choice')" title="Jednokrotny wybór" prepend-icon="mdi-radiobox-marked"></v-list-item>
                <v-list-item @click="addQuestion('number')" title="Liczbowe" prepend-icon="mdi-numeric"></v-list-item>
              </v-list>
            </v-menu>
          </div>

          <v-slide-y-transition group>
            <v-card
              v-for="(question, index) in survey.questions"
              :key="index"
              class="mb-4 rounded-lg border"
              elevation="1"
            >
              <v-card-title class="d-flex justify-space-between align-center py-2 px-4 bg-grey-lighten-4">
                <span class="text-subtitle-1 font-weight-bold">Pytanie {{ index + 1 }} ({{ getTypeName(question.type) }})</span>
                <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removeQuestion(index)"></v-btn>
              </v-card-title>
              
              <v-card-text class="pa-4">
                <v-text-field
                  v-model="question.text"
                  label="Treść pytania"
                  :rules="[v => !!v || 'Treść pytania jest wymagana']"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>

                <div class="d-flex align-center mb-2">
                   <v-checkbox
                     v-model="question.required"
                     label="Wymagane"
                     density="compact"
                     hide-details
                   ></v-checkbox>
                </div>

                <!-- Opcje dla pytania typu CHOICE -->
                <div v-if="question.type === 'choice'" class="ml-4 mt-2">
                  <p class="text-subtitle-2 mb-2">Opcje odpowiedzi:</p>
                  <div v-for="(_, optIndex) in question.options" :key="optIndex" class="d-flex align-center mb-2">
                    <v-icon icon="mdi-radiobox-blank" size="small" class="mr-2 text-grey"></v-icon>
                    <v-text-field
                      v-model="question.options[optIndex]"
                      placeholder="Opcja odpowiedzi"
                      variant="underlined"
                      density="compact"
                      hide-details
                      class="flex-grow-1"
                    ></v-text-field>
                    <v-btn icon="mdi-close" variant="text" color="grey" size="x-small" @click="removeOption(index, optIndex)"></v-btn>
                  </div>
                  <v-btn size="small" variant="text" color="primary" @click="addOption(index)" prepend-icon="mdi-plus">
                    Dodaj opcję
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-slide-y-transition>

          <v-alert v-if="survey.questions.length === 0" type="info" variant="tonal" class="mb-6">
            Dodaj przynajmniej jedno pytanie do ankiety.
          </v-alert>

        </v-col>

        <!-- PRAWA KOLUMNA: Pacjenci -->
        <v-col cols="12" md="4">
          <v-card class="rounded-lg pa-4 position-sticky" style="top: 20px">
            <v-card-title>Przypisz do pacjentów</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="searchPatient"
                label="Szukaj pacjenta"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                class="mb-4"
              ></v-text-field>

              <div v-if="loadingPatients" class="text-center py-4">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              <div v-else>
                 <v-checkbox
                    v-model="selectAll"
                    label="Zaznacz wszystkich (widocznych)"
                    @update:model-value="toggleAllPatients"
                    hide-details
                    class="mb-2 font-weight-bold"
                 ></v-checkbox>
                 <v-divider class="mb-2"></v-divider>
                 
                 <div style="max-height: 400px; overflow-y: auto">
                    <v-checkbox
                      v-for="patient in filteredPatients"
                      :key="patient.id"
                      v-model="selectedPatients"
                      :label="getPatientLabel(patient)"
                      :value="patient.id"
                      density="compact"
                      hide-details
                    ></v-checkbox>
                 </div>
                 <div v-if="filteredPatients.length === 0" class="text-caption text-grey mt-2">
                   Brak pacjentów spełniających kryteria.
                 </div>
              </div>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="pa-4">
              <v-btn
                block
                color="primary"
                variant="flat"
                size="large"
                type="submit"
                :loading="submitting"
                :disabled="survey.questions.length === 0"
              >
                Utwórz Ankietę
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-form>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createSurvey } from '../../services/survey.service'
import { getMyPatients } from '../../services/therapist.service'

const router = useRouter()

/* ---------- Stan ---------- */

interface Question {
  text: string
  type: 'text' | 'rating' | 'choice' | 'number'
  required: boolean
  options: string[] // Używane tylko dla choice
}

const survey = reactive({
  title: '',
  description: '',
  questions: [] as Question[]
})

const patients = ref<any[]>([])
const selectedPatients = ref<number[]>([])
const selectAll = ref(false)
const searchPatient = ref('')

const loadingPatients = ref(false)
const submitting = ref(false)
const snackbar = reactive({ show: false, text: '', color: 'success' })

/* ---------- Computed ---------- */

const filteredPatients = computed(() => {
  if (!searchPatient.value) return patients.value
  const q = searchPatient.value.toLowerCase()
  return patients.value.filter(p => 
    p.email.toLowerCase().includes(q) || 
    (p.first_name && p.first_name.toLowerCase().includes(q)) || 
    (p.last_name && p.last_name.toLowerCase().includes(q))
  )
})

/* ---------- Metody ---------- */

const getPatientLabel = (p: any) => {
  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim()
  return name ? `${name} (${p.email})` : p.email
}

const addQuestion = (type: 'text' | 'rating' | 'choice' | 'number') => {
  survey.questions.push({
    text: '',
    type,
    required: true,
    options: type === 'choice' ? [''] : []
  })
}

const removeQuestion = (index: number) => {
  survey.questions.splice(index, 1)
}

const addOption = (qIndex: number) => {
  survey.questions[qIndex].options.push('')
}

const removeOption = (qIndex: number, optIndex: number) => {
  survey.questions[qIndex].options.splice(optIndex, 1)
}

const getTypeName = (type: string) => {
  const map: Record<string, string> = {
    text: 'Tekstowe',
    rating: 'Ocena',
    choice: 'Wybór',
    number: 'Liczba'
  }
  return map[type] || type
}


/* ---------- Pacjenci ---------- */

const fetchPatients = async () => {
  loadingPatients.value = true
  try {
    const data = await getMyPatients()
    patients.value = data
  } catch (e: any) {
    console.error(e)
    showSnackbar(e.message || 'Błąd pobierania pacjentów', 'error')
  } finally {
    loadingPatients.value = false
  }
}

const toggleAllPatients = (val: boolean | null) => {
  if (val === true) {
    // Add all filtered patients who aren't already selected
    const newIds = filteredPatients.value.map(p => p.id)
    selectedPatients.value = [...new Set([...selectedPatients.value, ...newIds])]
  } else {
    // Remove all filtered patients
    const filteredIds = new Set(filteredPatients.value.map(p => p.id))
    selectedPatients.value = selectedPatients.value.filter(id => !filteredIds.has(id))
  }
}


/* ---------- Zapis ---------- */

const submitSurvey = async () => {
  if (!survey.title) return
  if (survey.questions.length === 0) {
    showSnackbar('Dodaj pytania do ankiety', 'warning')
    return
  }

  submitting.value = true
  try {
    // Mapowanie pytań do formatu backendu
    const questionsPayload = survey.questions.map((q, idx) => ({
      question_text: q.text,
      question_type: q.type,
      required: q.required,
      ord: idx,
      options: q.type === 'choice' 
        ? q.options.map((opt, optIdx) => ({ option_text: opt, ord: optIdx }))
        : undefined
    }))

    await createSurvey({
      title: survey.title,
      description: survey.description,
      questions: questionsPayload,
      patientIds: selectedPatients.value // Backend już obsługuje to pole
    })

    showSnackbar('Ankieta utworzona pomyślnie!')
    setTimeout(() => {
      router.push('/doctor/surveys')
    }, 1000)
  } catch (e: any) {
    showSnackbar(e.message || 'Błąd tworzenia ankiety', 'error')
  } finally {
    submitting.value = false
  }
}

const showSnackbar = (text: string, color = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

onMounted(() => {
  fetchPatients()
})
</script>

<template>
  <v-container fluid>
    <h1 class="mb-6">Twoje ankiety</h1>

    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
    />

    <v-row justify="center">
      <v-col
        v-for="survey in surveys"
        :key="survey.id"
        cols="12"
        md="8"
        lg="6"
      >
        <v-card elevation="4" rounded="lg">
          <v-card-title class="pa-4 d-flex justify-space-between align-center">
            <span>{{ survey.title }}</span>
            <v-chip size="small" color="grey" v-if="survey.date">
              {{ formatSurveyDate(survey.date) }}
            </v-chip>
          </v-card-title>

          <v-card-subtitle v-if="survey.description">
            {{ survey.description }}
          </v-card-subtitle>

          <!-- OSTATNIA AKTUALIZACJA -->
          <v-card-subtitle
            v-if="statusMap[survey.id]"
            class="text-caption text-grey"
          >
            Ostatnia aktualizacja:
            {{ formatDate(statusMap[survey.id]!) }}
          </v-card-subtitle>

          <v-card-actions>
            <v-btn
              color="primary"
              :to="`/patient/surveys/${survey.id}`"
            >
              {{ statusMap[survey.id] ? 'Edytuj' : 'Wypełnij' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  getSurveys,
  getMySurveyStatus,
} from '../../services/survey.service'
import { useTheme } from 'vuetify'
import { useUiStore } from '../../stores/ui.store'

/* ---------- types ---------- */

interface Survey {
  id: number
  title: string
  description?: string
  date?: string
}

interface SurveyStatus {
  surveyId: number
  updatedAt: string
}

/* ---------- state ---------- */

const surveys = ref<Survey[]>([])
const loading = ref(false)

const statusMap = ref<Record<number, Date>>({})

const uiStore = useUiStore()
const theme = useTheme()

watch(
  () => uiStore.theme,
  (val) => {
    // @ts-ignore
    if (typeof theme.change === 'function') {
      // @ts-ignore
      theme.change(val)
    } else {
      theme.global.name.value = val
    }
  },
  { immediate: true },
)

/* ---------- lifecycle ---------- */

onMounted(async () => {
  loading.value = true
  try {
    const [surveyList, statuses] = await Promise.all([
      getSurveys(),
      getMySurveyStatus(),
    ])

    surveys.value = surveyList

    const map: Record<number, Date> = {}
    for (const s of statuses as SurveyStatus[]) {
      map[s.surveyId] = new Date(s.updatedAt)
    }
    statusMap.value = map
  } finally {
    loading.value = false
  }
})

/* ---------- helpers ---------- */

const formatDate = (date: Date): string => {
  return date.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatSurveyDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

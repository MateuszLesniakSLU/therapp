<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1>Moi Pacjenci</h1>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddDialog = true">
        Dodaj Pacjenta
      </v-btn>
    </div>

    <!-- ... existing list ... -->
    <v-card v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-card>

    <v-list v-else lines="two">
      <v-list-item
        v-for="patient in patients"
        :key="patient.id"
        :title="`${patient.first_name || 'Bez imienia'} ${patient.last_name || 'Bez nazwiska'}`"
        :subtitle="patient.email"
        prepend-icon="mdi-account"
        @click="goToDetails(patient.id)"
        link
      >
        <template v-slot:append>
          <v-icon color="grey">mdi-chevron-right</v-icon>
        </template>
      </v-list-item>
    </v-list>
    
    <v-alert v-if="!loading && patients.length === 0" type="info">
      Brak przypisanych pacjentów.
    </v-alert>

    <!-- Dialog Dodawania -->
    <v-dialog v-model="showAddDialog" max-width="400px">
      <v-card>
        <v-card-title>Połącz z pacjentem</v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-2">
            Wpisz 6-cyfrowy kod wygenerowany przez pacjenta w jego panelu "Moi Doktorzy".
          </p>
          <v-text-field
            v-model="connectCode"
            label="Kod pacjenta"
            placeholder="123456"
            :error-messages="connectError"
            maxlength="6"
            counter
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeAddDialog">Anuluj</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="connecting"
            :disabled="connectCode.length !== 6"
            @click="connectPatient"
          >
            Połącz
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getMyPatients } from '../../services/therapist.service'
import { requestConnection } from '../../services/connection.service'

const patients = ref<any[]>([])
const loading = ref(true)
const router = useRouter()

const showAddDialog = ref(false)
const connectCode = ref('')
const connectError = ref('')
const connecting = ref(false)

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

const goToDetails = (id: number) => {
  router.push(`/doctor/patients/${id}`)
}

const closeAddDialog = () => {
  showAddDialog.value = false
  connectCode.value = ''
  connectError.value = ''
}

const connectPatient = async () => {
  connectError.value = ''
  connecting.value = true
  try {
    await requestConnection(connectCode.value)
    snackbar.text = 'Wysłano prośbę o połączenie! Pacjent musi ją zaakceptować.'
    snackbar.color = 'success'
    snackbar.show = true
    closeAddDialog()
    // Refresh list? Usually pending won't show here immediately if this list only shows active connections?
    // Let's assume this list shows only active ones as per `getTherapistPatients` logic?
    // If we want to accept pending here, we need another view. But per requirements flow:
    // "Użytkownik musi zaakceptować dodatkowo to zaproszenie, będzie mu się wyświetlało to w zakładce moi doktorzy"
    // So patient accepts. Therapist just waits.
  } catch (e: any) {
    connectError.value = e.message || 'Błąd połączenia'
  } finally {
    connecting.value = false
  }
}

onMounted(async () => {
  try {
    patients.value = await getMyPatients()
  } catch {
    patients.value = []
  } finally {
    loading.value = false
  }
})
</script>


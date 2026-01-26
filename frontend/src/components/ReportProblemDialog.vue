<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <template v-slot:activator="{ props }">
      <v-list-item
        v-bind="props"
        prepend-icon="mdi-alert-circle-outline"
        title="Zgłoś problem"
      />
    </template>

    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
        Zgłoś problem
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="submitReport">
          <p class="text-body-2 text-medium-emphasis mb-4">
            Opisz problem, na jaki natrafiłeś. Wiadomość zostanie wysłana do administratora systemu.
          </p>
          
          <v-textarea
            v-model="message"
            label="Opis problemu"
            placeholder="Opisz szczegółowo, na czym polega problem..."
            :rules="[rules.required, rules.minLength]"
            rows="5"
            counter="2000"
            maxlength="2000"
            required
            variant="outlined"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
          :disabled="loading"
        >
          Anuluj
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="submitReport"
          :loading="loading"
          :disabled="!message || message.length < 10"
        >
          Wyślij zgłoszenie
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { API_URL } from '../config'

const auth = useAuthStore()

const dialog = ref(false)
const message = ref('')
const loading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const rules = {
  required: (v: string) => !!v || 'To pole jest wymagane',
  minLength: (v: string) => (v && v.length >= 10) || 'Opis musi mieć co najmniej 10 znaków'
}

const closeDialog = () => {
  dialog.value = false
  message.value = ''
}

const submitReport = async () => {
  if (!message.value || message.value.length < 10) return
  
  loading.value = true
  
  try {
    const userEmail = auth.user?.email || 'nieznany@therapp.local'
    
    const res = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        message: `[Zgłoszenie problemu od użytkownika ${auth.user?.first_name || ''} ${auth.user?.last_name || ''} (${auth.role})]\n\n${message.value}`
      })
    })
    
    if (!res.ok) {
      throw new Error('Błąd wysyłania zgłoszenia')
    }
    
    snackbarColor.value = 'success'
    snackbarText.value = 'Zgłoszenie zostało wysłane pomyślnie!'
    snackbar.value = true
    closeDialog()
  } catch (error) {
    snackbarColor.value = 'error'
    snackbarText.value = 'Wystąpił błąd podczas wysyłania zgłoszenia'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}
</script>

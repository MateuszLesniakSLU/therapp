<template>
  <v-app>
    <v-main class="d-flex align-center justify-center">
      <v-card width="400" class="pa-6">
        <div class="d-flex justify-center pt-6">
          <AppLogo :height="150" />
        </div>
        <v-card-title class="text-h6 text-center">
          Weryfikacja email
        </v-card-title>

        <v-card-text class="text-center">
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>

          <v-alert
            v-if="error"
            type="error"
            class="mt-3"
            variant="tonal"
          >
            {{ error }}
          </v-alert>

          <v-alert
            v-if="success"
            type="success"
            class="mt-3"
            variant="tonal"
          >
            {{ successMessage }}
          </v-alert>

          <div class="mt-4" v-if="!loading">
            <router-link to="/login" class="text-primary text-decoration-none font-weight-bold">
              Przejdź do logowania
            </router-link>
          </div>
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { API_URL } from '../config'
import AppLogo from '../components/AppLogo.vue'

const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref(false)
const successMessage = ref('')

onMounted(async () => {
  const token = route.params.token as string
  
  try {
    const res = await fetch(`${API_URL}/auth/verify-email/${token}`)
    const data = await res.json()
    
    if (res.ok) {
      success.value = true
      successMessage.value = data.message || 'Email został zweryfikowany. Możesz się teraz zalogować.'
    } else {
      error.value = data.message || 'Nieprawidłowy lub wygasły link weryfikacyjny.'
    }
  } catch (e) {
    error.value = 'Błąd weryfikacji email.'
  } finally {
    loading.value = false
  }
})
</script>

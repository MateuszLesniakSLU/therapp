<template>
  <v-app>
    <v-main class="d-flex align-center justify-center">
      <v-card width="400" class="pa-6">
        <div class="d-flex justify-center pt-6">
          <AppLogo :height="150" />
        </div>
        <v-card-title class="text-h6 text-center">
          Zapomniałeś hasła?
        </v-card-title>

        <v-card-text>
          <p class="text-body-2 text-grey mb-4 text-center">
            Podaj swój adres email, a wyślemy Ci link do zresetowania hasła.
          </p>

          <v-form @submit.prevent="submit" v-if="!success">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              required
            />

            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              block
              :loading="loading"
              class="mt-4"
            >
              Wyślij link
            </v-btn>
          </v-form>

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

          <v-divider class="my-4"></v-divider>

          <div class="text-center">
            <router-link to="/login" class="text-primary text-decoration-none">
              Wróć do logowania
            </router-link>
          </div>
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import AppLogo from '../components/AppLogo.vue'

const auth = useAuthStore()

const email = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const successMessage = ref('')

const submit = async () => {
  loading.value = true
  error.value = null

  try {
    const result = await auth.forgotPassword(email.value)
    success.value = true
    successMessage.value = result.message || 'Jeśli konto istnieje, link do resetowania hasła został wysłany.'
  } catch (e: any) {
    error.value = e.message || 'Błąd wysyłania'
  } finally {
    loading.value = false
  }
}
</script>

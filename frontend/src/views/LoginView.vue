<template>
  <v-app>
    <v-main class="d-flex align-center justify-center">
      <v-card width="400" class="pa-6">
        <div class="d-flex justify-center pt-6">
          <AppLogo :height="150" />
        </div>
        <v-card-title class="text-h6 text-center">
          Logowanie
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="login">
            <v-text-field
              v-model="username"
              label="Login"
              required
            />

            <v-text-field
              v-model="password"
              label="Hasło"
              type="password"
              required
            />

            <v-btn
              type="submit"
              color="primary"
              block
              :loading="loading"
              class="mt-4"
            >
              Zaloguj się
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
        </v-card-text>
      </v-card>
    </v-main>
  </v-app>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import AppLogo from '../components/AppLogo.vue'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const login = async () => {
  loading.value = true
  error.value = null

    await auth.login(username.value, password.value)

  try {
    await auth.login(username.value, password.value)

    if (auth.role === 'patient') router.push('/patient')
    if (auth.role === 'therapist') router.push('/doctor')
    if (auth.role === 'admin') router.push('/admin')

  } catch (e: any) {
    error.value = e.message || 'Błąd logowania'
  } finally {
    loading.value = false
  }
}
</script>

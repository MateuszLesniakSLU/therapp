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
              v-model="email"
              label="Email"
              type="email"
              required
            />

            <v-text-field
              v-model="password"
              label="Hasło"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
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

          <div class="text-center mt-4">
            <router-link to="/forgot-password" class="text-primary text-decoration-none">
              Zapomniałeś hasła?
            </router-link>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="text-center">
            <span class="text-grey">Nie masz konta? </span>
            <router-link to="/register" class="text-primary text-decoration-none font-weight-bold">
              Zarejestruj się
            </router-link>
          </div>
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

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const login = async () => {
  loading.value = true
  error.value = null

  try {
    await auth.login(email.value, password.value)

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

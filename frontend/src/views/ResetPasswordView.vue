<template>
  <v-app>
    <v-main class="d-flex align-center justify-center">
      <v-card width="400" class="pa-6">
        <div class="d-flex justify-center pt-6">
          <AppLogo :height="150" />
        </div>
        <v-card-title class="text-h6 text-center">
          Ustaw nowe hasło
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="submit" v-if="!success">
            <v-text-field
              v-model="password"
              label="Nowe hasło"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :rules="[rules.required, rules.minLength]"
              required
            />

            <v-text-field
              v-model="confirmPassword"
              label="Potwierdź hasło"
              :type="showConfirmPassword ? 'text' : 'password'"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
              :rules="[rules.required, rules.passwordMatch]"
              required
            />

            <v-btn
              type="submit"
              color="primary"
              block
              :loading="loading"
              class="mt-4"
            >
              Zmień hasło
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

          <div class="text-center mt-4" v-if="success">
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
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import AppLogo from '../components/AppLogo.vue'

const auth = useAuthStore()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)
const successMessage = ref('')

const rules = {
  required: (v: string) => !!v || 'Pole wymagane',
  minLength: (v: string) => v.length >= 12 || 'Hasło musi mieć co najmniej 12 znaków',
  passwordMatch: (v: string) => v === password.value || 'Hasła się nie zgadzają',
}

const submit = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Hasła się nie zgadzają'
    return
  }

  loading.value = true
  error.value = null

  try {
    const token = route.params.token as string
    const result = await auth.resetPassword(token, password.value)
    success.value = true
    successMessage.value = result.message || 'Hasło zostało zmienione. Możesz się teraz zalogować.'
  } catch (e: any) {
    error.value = e.message || 'Błąd resetowania hasła'
  } finally {
    loading.value = false
  }
}
</script>

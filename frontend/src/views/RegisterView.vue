<template>
  <v-app>
    <v-main class="d-flex align-center justify-center">
      <v-card width="400" class="pa-6">
        <div class="d-flex justify-center pt-6">
          <AppLogo :height="150" />
        </div>
        <v-card-title class="text-h6 text-center">
          Rejestracja
        </v-card-title>

        <v-card-text>
          <v-form @submit.prevent="register" v-if="!success">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="firstName"
                  label="Imię"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="lastName"
                  label="Nazwisko"
                  :rules="[rules.required]"
                  required
                />
              </v-col>
            </v-row>

            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              :rules="[rules.required, rules.email]"
              required
            />

            <v-text-field
              v-model="password"
              label="Hasło"
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
              variant="flat"
              block
              :loading="loading"
              class="mt-4"
            >
              Zarejestruj się
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
            <span class="text-grey">Masz już konto? </span>
            <router-link to="/login" class="text-primary text-decoration-none font-weight-bold">
              Zaloguj się
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

const firstName = ref('')
const lastName = ref('')
const email = ref('')
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
  email: (v: string) => /.+@.+\..+/.test(v) || 'Nieprawidłowy email',
  minLength: (v: string) => v.length >= 12 || 'Hasło musi mieć co najmniej 12 znaków',
  passwordMatch: (v: string) => v === password.value || 'Hasła się nie zgadzają',
}

const register = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = 'Hasła się nie zgadzają'
    return
  }

  loading.value = true
  error.value = null

  try {
    const result = await auth.register(email.value, password.value, firstName.value, lastName.value)
    success.value = true
    successMessage.value = result.message || 'Rejestracja zakończona. Sprawdź email, aby aktywować konto.'
  } catch (e: any) {
    error.value = e.message || 'Błąd rejestracji'
  } finally {
    loading.value = false
  }
}
</script>

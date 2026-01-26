<template>
  <v-container>
    <!-- DANE OSOBOWE -->
    <v-card class="mb-6">
      <v-card-title>Dane osobowe</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="updateProfile">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.firstName"
                label="Imię"
                required
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.lastName"
                label="Nazwisko"
                required
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="profile.email"
                label="Email"
                type="email"
                required
              />
            </v-col>
          </v-row>

          <v-btn
            color="primary"
            variant="flat"
            type="submit"
            :loading="loadingProfile"
          >
            Zapisz dane
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- ZMIANA HASŁA -->
    <v-card class="mb-6">
      <v-card-title>Zmiana hasła</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="changePassword">
          <v-text-field
            v-model="password.current"
            label="Aktualne hasło"
            type="password"
            required
          />

          <v-text-field
            v-model="password.new"
            label="Nowe hasło"
            type="password"
            required
          />

          <v-text-field
            v-model="password.repeat"
            label="Powtórz nowe hasło"
            type="password"
            required
          />

          <v-btn
            color="primary"
            variant="flat"
            type="submit"
            :loading="loadingPassword"
          >
            Zmień hasło
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- MOTYW -->
    <v-card>
      <v-card-title>Wygląd</v-card-title>
      <v-card-text class="d-flex align-center justify-space-between">
        <span>Tryb ciemny</span>
        <v-switch
          :model-value="uiStore.isDark"
          @update:model-value="uiStore.toggleTheme()"
        />
      </v-card-text>
    </v-card>

    <!-- SNACKBARY -->
    <v-snackbar v-model="showSuccess" color="success">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="error">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue'
import { useUiStore } from '../stores/ui.store'
import { useTheme } from 'vuetify'
import {
  getMe,
  updateMe,
  changeMyPassword,
} from '../services/patient.service'

const uiStore = useUiStore()
const theme = useTheme()

const showSuccess = ref(false)
const showError = ref(false)

const successMessage = ref('Zapisano zmiany')
const errorMessage = ref('')

const loadingProfile = ref(false)
const loadingPassword = ref(false)

const profile = reactive({
  firstName: '',
  lastName: '',
  email: '',
})

const password = reactive({
  current: '',
  new: '',
  repeat: '',
})

watch(
  () => uiStore.isDark,
  (val) => {
    if (typeof theme.change === 'function') {
      theme.change(val ? 'dark' : 'light')
    } else {
      theme.global.name.value = val ? 'dark' : 'light'
    }
  },
  { immediate: true },
)

/**
 * Pobranie danych użytkownika
 */
onMounted(async () => {
  try {
    const data = await getMe()
    profile.firstName = data.firstName
    profile.lastName = data.lastName
    profile.email = data.email
  } catch (e: any) {
    errorMessage.value = e.message || 'Nie udało się pobrać danych użytkownika'
    showError.value = true
  }
})

/**
 * Aktualizacja profilu
 */
const updateProfile = async () => {
  loadingProfile.value = true
  showError.value = false

  try {
    await updateMe({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    })
    showSuccess.value = true
  } catch (e: any) {
    errorMessage.value = e.message || 'Nie udało się zapisać danych'
    showError.value = true
  } finally {
    loadingProfile.value = false
  }
}

/**
 * Zmiana hasła
 */
const changePassword = async () => {
  showError.value = false

  if (password.new !== password.repeat) {
    errorMessage.value = 'Hasła nie są takie same'
    showError.value = true
    return
  }

  loadingPassword.value = true

  try {
    await changeMyPassword({
      currentPassword: password.current,
      newPassword: password.new,
    })

    password.current = ''
    password.new = ''
    password.repeat = ''

    showSuccess.value = true
  } catch (e: any) {
    errorMessage.value = e.message || 'Nie udało się zmienić hasła'
    showError.value = true
  } finally {
    loadingPassword.value = false
  }
}
</script>

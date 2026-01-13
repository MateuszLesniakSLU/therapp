<template>
  <v-navigation-drawer app permanent>
    <div class="d-flex justify-center py-4">
      <AppLogo :height="105" />
    </div>
    <div class="text-subtitle-2 text-center text-medium-emphasis mb-2">Panel Terapeuty</div>
    <v-divider></v-divider>

    <v-list>
      <v-list-item to="/doctor" prepend-icon="mdi-view-dashboard" title="Pulpit"></v-list-item>
      <v-list-item to="/doctor/patients" prepend-icon="mdi-account-group" title="Moi Pacjenci"></v-list-item>
      <v-list-item to="/doctor/settings" prepend-icon="mdi-cog" title="Ustawienia Konta"></v-list-item>
    </v-list>

    <template v-slot:append>
      <div class="pa-2">
        <v-btn block color="error" @click="logout" prepend-icon="mdi-logout">
          Wyloguj
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store'
import { useRouter } from 'vue-router'
import AppLogo from '../AppLogo.vue'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

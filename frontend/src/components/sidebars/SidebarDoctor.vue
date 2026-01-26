<template>
  <v-navigation-drawer app permanent>
    <div class="d-flex justify-center py-4">
      <AppLogo :height="105" />
    </div>
    <div class="text-subtitle-2 text-center text-medium-emphasis mb-2">Panel Terapeuty</div>
    <v-divider></v-divider>

    <v-list>
      <v-list-item to="/doctor" exact prepend-icon="mdi-view-dashboard" title="Pulpit"></v-list-item>
      <v-list-item to="/doctor/patients" prepend-icon="mdi-account-group" title="Moi Pacjenci"></v-list-item>
      <v-list-item to="/doctor/surveys" prepend-icon="mdi-clipboard-list" title="Ankiety"></v-list-item>
      <v-list-item to="/doctor/settings" prepend-icon="mdi-cog" title="Ustawienia Konta"></v-list-item>
    </v-list>

    <template v-slot:append>
      <div class="pa-2">
        <v-list density="compact" class="mb-2">
          <ReportProblemDialog />
        </v-list>
        <v-btn block color="error" @click="logout" prepend-icon="mdi-logout">
          Wyloguj
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store'
import AppLogo from '../AppLogo.vue'
import ReportProblemDialog from '../ReportProblemDialog.vue'

const auth = useAuthStore()

const logout = () => {
  auth.logout()
}
</script>

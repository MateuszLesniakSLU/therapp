<template>
  <v-navigation-drawer app permanent>
    <div class="d-flex justify-center py-4">
      <AppLogo :height="105" />
    </div>
    <div class="text-subtitle-2 text-center text-medium-emphasis mb-2">Panel Pacjenta</div>
    <v-divider></v-divider>

    <v-list>
      <v-list-item to="/patient" exact prepend-icon="mdi-view-dashboard" title="Pulpit" />
      <v-list-item to="/patient/surveys" prepend-icon="mdi-clipboard-list" title="Ankiety" />
      <v-list-item to="/patient/doctors" prepend-icon="mdi-doctor" title="Moi Terapeuci" />
      <v-list-item to="/patient/settings" prepend-icon="mdi-cog" title="Ustawienia" />
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

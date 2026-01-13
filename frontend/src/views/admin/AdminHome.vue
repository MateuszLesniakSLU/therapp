<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Panel Administratora</h1>
        <p class="text-subtitle-1 text-grey darken-1 mb-6">Zarządzanie użytkownikami i systemem.</p>
      </v-col>
    </v-row>

    <div v-if="loading" class="d-flex justify-center my-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-row v-else>
        <!-- Total Users -->
      <v-col cols="12" md="4">
        <v-card color="info" variant="tonal" class="pa-4 h-100">
          <div class="text-h2 font-weight-bold mb-1">{{ stats.totalUsers }}</div>
          <div class="text-subtitle-1 font-weight-medium">Wszystkich Użytkowników</div>
        </v-card>
      </v-col>
      <!-- Active Users -->
       <v-col cols="12" md="4">
        <v-card color="success" variant="tonal" class="pa-4 h-100">
          <div class="text-h2 font-weight-bold mb-1">{{ stats.activeUsers }}</div>
          <div class="text-subtitle-1 font-weight-medium">Aktywnych Kont</div>
        </v-card>
      </v-col>
      <!-- New Users -->
       <v-col cols="12" md="4">
        <v-card color="primary" variant="tonal" class="pa-4 h-100">
          <div class="text-h2 font-weight-bold mb-1">{{ stats.newUsers }}</div>
          <div class="text-subtitle-1 font-weight-medium">Nowych w tym tygodniu</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-6" v-if="!loading">
        <v-col cols="12" md="6">
            <v-card title="Dystrybucja Rol" elevation="2">
                <v-list>
                    <v-list-item v-for="role in stats.roles" :key="role.role">
                        <template v-slot:prepend>
                            <v-icon :icon="getRoleIcon(role.role)" color="primary"></v-icon>
                        </template>
                        <v-list-item-title class="text-capitalize">{{ role.role }}</v-list-item-title>
                        <template v-slot:append>
                            <v-chip>{{ role._count.role }}</v-chip>
                        </template>
                    </v-list-item>
                </v-list>
            </v-card>
        </v-col>
        <v-col cols="12" md="6">
            <v-card title="Szybkie akcje" elevation="2">
                <v-list>
                    <v-list-item to="/admin/users" prepend-icon="mdi-account-group" title="Zarządzaj użytkownikami"></v-list-item>
                    <v-list-item to="/admin/settings" prepend-icon="mdi-cog" title="Ustawienia systemu"></v-list-item>
                </v-list>
            </v-card>
        </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authHeaders } from '../../services/api'
import { API_URL } from '../../config'

const stats = ref({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    roles: [] as any[]
})
const loading = ref(true)

const getRoleIcon = (role: string) => {
    switch(role) {
        case 'admin': return 'mdi-shield-crown';
        case 'therapist': return 'mdi-doctor';
        case 'patient': return 'mdi-account';
        default: return 'mdi-account-circle';
    }
}

const fetchStats = async () => {
    try {
        const res = await fetch(`${API_URL}/users/stats/dashboard`, {
             headers: authHeaders()
        })
        if (res.ok) {
            stats.value = await res.json()
        }
    } catch (e) {
        console.error('Failed to fetch admin dashboard stats', e)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchStats()
})
</script>

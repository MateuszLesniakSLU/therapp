<template>
  <v-app>
    <SidebarPatient />
    <v-main class="main-content">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import SidebarPatient from '../components/sidebars/SidebarPatient.vue'
</script>

<style scoped>
.main-content {
  height: 100vh;
  overflow-y: auto;
}
</style>

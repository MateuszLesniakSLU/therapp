<template>
  <v-app>
    <SidebarAdmin />
    <v-main class="main-content">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import SidebarAdmin from '../components/sidebars/SidebarAdmin.vue'
</script>

<style scoped>
.main-content {
  height: 100vh;
  overflow-y: auto;
}
</style>

<template>
  <v-container>
    <h1 class="mb-6">Moi Doktorzy</h1>
    <ConnectionManager role="patient" />
  </v-container>
</template>

<script setup lang="ts">
import ConnectionManager from '../../components/ConnectionManager.vue';
</script>

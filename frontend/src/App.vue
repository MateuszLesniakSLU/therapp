<script setup lang="ts">
import { useUiStore } from './stores/ui.store'
useUiStore().init()
</script>

<template>
  <router-view />
</template>

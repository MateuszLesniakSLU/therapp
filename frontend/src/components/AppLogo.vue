<template>
  <img 
    :src="logoSrc" 
    alt="TherApp" 
    :height="height" 
    :style="{ maxWidth: '100%' }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const props = withDefaults(defineProps<{
  height?: number | string
}>(), {
  height: 40
})

const theme = useTheme()

const logoSrc = computed(() => {
  return theme.global.current.value.dark ? '/logo-dark.png' : '/logo-light.png'
})
</script>

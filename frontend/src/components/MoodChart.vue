<template>
  <div class="chart-container">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  labels: string[]
  data: number[]
  gradientStart?: string
  gradientEnd?: string
  borderColor?: string
  label?: string
  height?: number
}>()

const chartData = computed(() => {
  const color = props.borderColor || '#1976D2'
  
  return {
    labels: props.labels,
    datasets: [
      {
        label: props.label || 'Wartość',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, (props.height || 300))
          gradient.addColorStop(0, props.gradientStart || 'rgba(25, 118, 210, 0.2)')
          gradient.addColorStop(1, props.gradientEnd || 'rgba(25, 118, 210, 0.0)')
          return gradient
        },
        borderColor: color,
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: color,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointRadius: 4,
        pointHoverRadius: 6,
        data: props.data,
        fill: true,
        tension: 0.4
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      titleColor: '#000',
      bodyColor: '#666',
      borderColor: 'rgba(0,0,0,0.1)',
      borderWidth: 1,
      padding: 10,
      displayColors: false,
      callbacks: {
        label: (context: any) => `${context.parsed.y}`
      }
    }
  },
  scales: {
    y: {
      display: false,
      min: 0,
      suggestedMax: Math.max(...props.data) + 2
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        display: true,
        font: {
          family: "'Inter', sans-serif",
          size: 10
        },
        color: '#999'
      },
      border: {
        display: false
      }
    }
  },
  interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
  },
  element: {
    line: {
      borderCapStyle: 'round'
    }
  }
})) as any
</script>

<style scoped>
.chart-container {
  height: 100%;
  min-height: 150px;
  width: 100%;
  position: relative;
}
</style>

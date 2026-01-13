<template>
  <v-dialog v-model="internalDialog" max-width="900px">
    <v-card>
      <v-card-title>
        <span class="text-h5">Activity Logs: {{ userName }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="internalDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="logs"
          :loading="loading"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template v-slot:item.level="{ item }">
            <v-chip
              :color="getLevelColor(item.level)"
              size="small"
            >
              {{ item.level }}
            </v-chip>
          </template>

          <template v-slot:item.details="{ item }">
            <div v-if="item.details" class="details-json">
               <pre>{{ JSON.stringify(item.details, null, 2) }}</pre>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed } from 'vue';
import { authHeaders } from '../services/api';
import { API_URL } from '../config';

/**
 * Dialog wyświetlający logi aktywności użytkownika.
 */
export default defineComponent({
  name: 'UserLogsDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    userId: {
      type: Number,
      default: null
    },
    userName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const logs = ref<any[]>([]);
    const loading = ref(false);

    const internalDialog = computed({
      get: () => props.modelValue,
      set: (val) => emit('update:modelValue', val)
    });

    const headers = [
      { title: 'Czas', key: 'createdAt', width: '180px' },
      { title: 'Poziom', key: 'level', width: '100px' },
      { title: 'Akcja', key: 'action' },
      { title: 'Szczegóły', key: 'details' },
      { title: 'IP', key: 'ipAddress' },
    ];

    const fetchLogs = async () => {
      if (!props.userId) return;
      loading.value = true;
      try {
        const res = await fetch(`${API_URL}/logs/user/${props.userId}`, {
             headers: authHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            logs.value = Array.isArray(data) ? data : (data.logs || []);
        }
      } catch {
        logs.value = [];
      } finally {
        loading.value = false;
      }
    };

    watch(() => props.modelValue, (val) => {
      if (val && props.userId) {
        fetchLogs();
      }
    });

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('pl-PL');
    };

    const getLevelColor = (level: string) => {
      switch (level) {
        case 'ERROR': return 'red';
        case 'WARN': return 'orange';
        case 'INFO': return 'blue';
        default: return 'grey';
      }
    };

    return {
      internalDialog,
      logs,
      loading,
      headers,
      formatDate,
      getLevelColor
    };
  }
});
</script>

<style scoped>
.details-json pre {
  white-space: pre-wrap;
  font-size: 0.8em;
  background: #f5f5f5;
  padding: 4px;
  border-radius: 4px;
  max-height: 100px;
  overflow-y: auto;
}
</style>

<template>
  <v-card class="mb-6">
    <v-card-title>Zarządzanie połączeniami</v-card-title>
    <v-card-text>
      <div v-if="role === 'patient'" class="mb-6">
        <h3 class="text-h6 mb-2">Twój kod połączenia</h3>
        <p class="mb-4 text-body-2">
          Podaj ten kod swojemu terapeucie, aby mógł Cię dodać do listy pacjentów.
        </p>
        
        <div class="d-flex flex-column align-center justify-center text-center">
          <v-btn
            color="primary"
            size="large"
            @click="generateNewCode"
            :loading="loadingCode"
            class="mb-4"
          >
            Generuj Kod
          </v-btn>
          
          <div v-if="code" class="d-flex flex-column align-center">
             <div class="text-h2 font-weight-bold letter-spacing-4 mb-2 text-primary">
                {{ code }}
             </div>
             <div class="text-caption text-grey">
                Ważny do: {{ new Date(expires).toLocaleTimeString() }}
             </div>
          </div>
        </div>
      </div>

      <v-divider class="my-4"></v-divider>

      <h3 class="text-h6 mb-4">
        {{ role === 'patient' ? 'Moi Terapeuci' : 'Oczekujące prośby' }}
      </h3>

      <div v-if="loadingList" class="text-center">
        <v-progress-circular indeterminate></v-progress-circular>
      </div>

      <v-list v-else lines="two">
        <v-list-item
          v-for="conn in connections"
          :key="conn.id"
        >
          <template v-slot:prepend>
             <v-icon :color="conn.status === 'ACTIVE' ? 'success' : 'warning'">
               {{ conn.status === 'ACTIVE' ? 'mdi-check-circle' : 'mdi-clock-outline' }}
             </v-icon>
          </template>

          <v-list-item-title>
            <span v-if="role === 'patient'">
              {{ conn.therapist?.first_name }} {{ conn.therapist?.last_name }} 
              ({{ conn.therapist?.username }})
            </span>
            <span v-else>
               {{ conn.patient?.first_name }} {{ conn.patient?.last_name }}
               ({{ conn.patient?.username }})
            </span>
          </v-list-item-title>

          <v-list-item-subtitle>
            Status: {{ conn.status === 'ACTIVE' ? 'Aktywny' : 'Oczekuje na akceptację' }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <div class="d-flex gap-2">
              <!-- Tylko pacjent akceptuje -->
              <v-btn
                v-if="role === 'patient' && conn.status === 'PENDING'"
                color="success"
                size="small"
                variant="flat"
                class="mr-2"
                @click="accept(conn.id)"
              >
                Akceptuj
              </v-btn>

              <v-btn
                color="error"
                size="small"
                variant="text"
                @click="remove(conn.id)"
              >
                {{ conn.status === 'PENDING' ? 'Odrzuć' : 'Usuń' }}
              </v-btn>
            </div>
          </template>
        </v-list-item>
        
        <v-alert v-if="connections.length === 0" type="info" variant="tonal">
          Brak połączeń.
        </v-alert>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { generateCode, getMyConnections, acceptConnection, deleteConnection, type Connection } from '../services/connection.service'

const props = defineProps<{
  role: 'patient' | 'therapist'
}>()

const code = ref('')
const expires = ref('')
const loadingCode = ref(false)
const loadingList = ref(false)
const connections = ref<Connection[]>([])

const generateNewCode = async () => {
  loadingCode.value = true
  try {
    const data = await generateCode()
    code.value = data.code
    expires.value = data.expires
  } catch (e) {
    console.error(e)
  } finally {
    loadingCode.value = false
  }
}

const fetchConnections = async () => {
  loadingList.value = true
  try {
    connections.value = await getMyConnections()
  } catch (e) {
    console.error(e)
  } finally {
    loadingList.value = false
  }
}

const accept = async (id: number) => {
  try {
    await acceptConnection(id)
    await fetchConnections()
  } catch (e) {
    console.error(e)
  }
}

const remove = async (id: number) => {
  if (!confirm('Czy na pewno chcesz usunąć to połączenie?')) return
  try {
    await deleteConnection(id)
    await fetchConnections()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchConnections()
})
</script>

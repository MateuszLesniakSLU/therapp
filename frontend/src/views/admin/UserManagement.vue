<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">Pulpit Administratora</h1>

    <!-- Sekcja statystyk -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl" elevation="0" border>
           <div class="d-flex align-center mb-4">
             <v-avatar color="primary-lighten-4" class="mr-3" rounded="lg">
               <v-icon color="primary">mdi-account-group</v-icon>
             </v-avatar>
             <div>
               <div class="text-caption text-medium-emphasis font-weight-bold">CAŁKOWITA LICZBA UŻYTKOWNIKÓW</div>
               <div class="text-h5 font-weight-black">{{ stats.total }}</div>
             </div>
           </div>
           <div class="text-caption text-medium-emphasis mt-1 mb-2">
             Nowi użytkownicy (ostatnie 7 dni)
           </div>
           <div style="height: 120px">
              <MoodChart 
                :labels="stats.newUsersLabels" 
                :data="stats.newUsersData" 
                gradient-start="rgba(25, 118, 210, 0.2)"
                border-color="#1976D2"
                :height="120"
              />
           </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl" elevation="0" border>
           <div class="d-flex align-center mb-4">
             <v-avatar color="success-lighten-4" class="mr-3" rounded="lg">
               <v-icon color="success">mdi-check-circle</v-icon>
             </v-avatar>
             <div>
               <div class="text-caption text-medium-emphasis font-weight-bold">AKTYWNI UŻYTKOWNICY</div>
               <div class="text-h5 font-weight-black">{{ stats.active }}</div>
             </div>
           </div>
           <div style="height: 120px; border: 2px dashed rgba(var(--v-theme-on-surface), 0.2)" class="d-flex align-center justify-center rounded-lg">
              <span class="text-caption text-medium-emphasis">Brak historii aktywności</span>
           </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="pa-4 rounded-xl" elevation="0" border>
           <div class="d-flex align-center mb-4">
             <v-avatar color="purple-lighten-4" class="mr-3" rounded="lg">
               <v-icon color="purple">mdi-shield-account</v-icon>
             </v-avatar>
             <div>
               <div class="text-caption text-medium-emphasis font-weight-bold">PACJENCI / TERAPEUCI</div>
               <div class="text-h5 font-weight-black">{{ stats.rolesData[0] }} / {{ stats.rolesData[1] }}</div>
             </div>
           </div>
           <div style="height: 120px">
               <div class="d-flex align-end justify-space-around h-100 pb-2">
                  <div class="d-flex flex-column align-center">
                    <div class="bg-blue rounded-t-lg" style="width: 20px" :style="{ height: (stats.rolesData[0] * 10) + 'px', maxHeight: '100px' }"></div>
                    <span class="text-caption mt-1">Pac</span>
                  </div>
                  <div class="d-flex flex-column align-center">
                    <div class="bg-green rounded-t-lg" style="width: 20px" :style="{ height: (stats.rolesData[1] * 10) + 'px', maxHeight: '100px' }"></div>
                    <span class="text-caption mt-1">Ter</span>
                  </div>
                  <div class="d-flex flex-column align-center">
                    <div class="bg-purple rounded-t-lg" style="width: 20px" :style="{ height: (stats.rolesData[2] * 10) + 'px', maxHeight: '100px' }"></div>
                    <span class="text-caption mt-1">Adm</span>
                  </div>
               </div>
           </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="rounded-xl border" elevation="0">
      <v-card-title class="d-flex align-center pa-6">
        Lista Użytkowników
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Szukaj"
          single-line
          hide-details
          density="compact"
          class="flex-grow-0"
          style="width: 300px"
        ></v-text-field>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        :loading="loading"
        hover
      >
        <template v-slot:item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'error'"
            size="small"
          >
            {{ item.isActive ? 'Aktywny' : 'Nieaktywny' }}
          </v-chip>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
          >
             {{ getRoleName(item.role) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-history"
            size="small"
            variant="text"
            color="info"
            class="mr-2"
            title="Logi aktywności"
            @click="openLogsDialog(item)"
          ></v-btn>

          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            class="mr-2"
            @click="openEditDialog(item)"
          ></v-btn>

          <v-btn
            v-if="item.isActive"
            icon="mdi-account-off"
            size="small"
            variant="text"
            color="error"
            title="Dezaktywuj"
            @click="confirmToggleActive(item)"
          ></v-btn>

          <v-btn
            v-else
            icon="mdi-account-check"
            size="small"
            variant="text"
            color="success"
            title="Aktywuj"
            @click="confirmToggleActive(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog Edycji -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title>Edytuj Użytkownika</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveUser">
            <v-text-field
              v-model="editedUser.first_name"
              label="Imię"
            ></v-text-field>
            <v-text-field
              v-model="editedUser.last_name"
              label="Nazwisko"
            ></v-text-field>
            <v-text-field
              v-model="editedUser.email"
              label="Email"
              type="email"
            ></v-text-field>
            <v-select
              v-model="editedUser.role"
              :items="roles"
              item-title="title"
              item-value="value"
              label="Rola"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeEditDialog">Anuluj</v-btn>
          <v-btn color="primary" variant="text" @click="saveUser">Zapisz</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Potwierdzenia -->
    <v-dialog v-model="confirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Potwierdzenie</v-card-title>
        <v-card-text>
          Czy na pewno chcesz {{ userToToggle?.isActive ? 'dezaktywować' : 'aktywować' }} użytkownika {{ userToToggle?.email }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="confirmDialog = false">Anuluj</v-btn>
          <v-btn
            :color="userToToggle?.isActive ? 'error' : 'success'"
            variant="text"
            @click="toggleActiveUser"
          >
            Potwierdź
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>

    <UserLogsDialog
      v-model="logsDialog"
      :user-id="logsUserId"
      :user-name="logsUserName"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import {
  getAllUsers,
  updateUser,
  activateUser,
  deactivateUser,
  type User
} from '../../services/admin.service'
import UserLogsDialog from '../../components/UserLogsDialog.vue'
import MoodChart from '../../components/MoodChart.vue'

const users = ref<User[]>([])
const loading = ref(false)
const search = ref('')

const stats = computed(() => {
    const total = users.value.length
    const active = users.value.filter(u => u.isActive).length
    
    const now = new Date()
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date()
        date.setDate(now.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
    })
    
    const newUsersData = last7Days.map(date => {
        return users.value.filter(user => user.createdAt && user.createdAt.startsWith(date)).length
    })
    
    const roles = {
        patient: users.value.filter(user => user.role === 'patient').length,
        therapist: users.value.filter(user => user.role === 'therapist').length,
        admin: users.value.filter(user => user.role === 'admin').length
    }
    
    return {
        total,
        active,
        newUsersData,
        newUsersLabels: last7Days.map(d => d.slice(5)),
        rolesData: [roles.patient, roles.therapist, roles.admin]
    }
})

const logsDialog = ref(false)
const logsUserId = ref<number | null>(null)
const logsUserName = ref('')

const openLogsDialog = (user: User) => {
  logsUserId.value = user.id
  logsUserName.value = user.email
  logsDialog.value = true
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Email', key: 'email' },
  { title: 'Rola', key: 'role' },
  { title: 'Status', key: 'isActive' },
  { title: 'Akcje', key: 'actions', sortable: false },
]

const roles = [
  { title: 'Pacjent', value: 'patient' },
  { title: 'Terapeuta', value: 'therapist' },
  { title: 'Administrator', value: 'admin' },
]

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
})

const getRoleColor = (role: string) => {
  switch (role) {
    case 'admin': return 'purple'
    case 'therapist': return 'blue'
    default: return 'green'
  }
}

const getRoleName = (role: string) => {
    switch (role) {
    case 'admin': return 'Administrator'
    case 'therapist': return 'Terapeuta'
    default: return 'Pacjent'
  }
}

const editDialog = ref(false)
const editedUser = reactive<Partial<User>>({})

const openEditDialog = (item: User) => {
  Object.assign(editedUser, item)
  editDialog.value = true
}

const closeEditDialog = () => {
  editDialog.value = false
}

const saveUser = async () => {
  if (!editedUser.id) return
  try {
    const updated = await updateUser(editedUser.id, {
      first_name: editedUser.first_name,
      last_name: editedUser.last_name,
      email: editedUser.email,
      role: editedUser.role,
    })
    
    const index = users.value.findIndex(u => u.id === editedUser.id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updated }
    }
    
    showSnackbar('Zaktualizowano użytkownika')
    closeEditDialog()
  } catch (e) {
    showSnackbar('Błąd aktualizacji', 'error')
  }
}

const confirmDialog = ref(false)
const userToToggle = ref<User | null>(null)

const confirmToggleActive = (item: User) => {
  userToToggle.value = item
  confirmDialog.value = true
}

const toggleActiveUser = async () => {
  if (!userToToggle.value) return
  try {
    if (userToToggle.value.isActive) {
      await deactivateUser(userToToggle.value.id)
      userToToggle.value.isActive = false
      showSnackbar('Użytkownik zdezaktywowany')
    } else {
      await activateUser(userToToggle.value.id)
      userToToggle.value.isActive = true
      showSnackbar('Użytkownik aktywowany')
    }
  } catch (e) {
    showSnackbar('Wystąpił błąd', 'error')
  } finally {
    confirmDialog.value = false
  }
}

const showSnackbar = (text: string, color = 'success') => {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await getAllUsers()
  } catch (e) {
    showSnackbar('Nie udało się pobrać listy użytkowników', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

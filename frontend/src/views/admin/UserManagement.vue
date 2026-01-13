<template>
  <v-container>
    <h1 class="mb-6">Zarządzanie Użytkownikami</h1>

    <v-card>
      <v-card-title class="d-flex align-center">
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
          Czy na pewno chcesz {{ userToToggle?.isActive ? 'dezaktywować' : 'aktywować' }} użytkownika {{ userToToggle?.username }}?
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
import { ref, onMounted, reactive } from 'vue'
import {
  getAllUsers,
  updateUser,
  activateUser,
  deactivateUser,
  type User
} from '../../services/admin.service'
import UserLogsDialog from '../../components/UserLogsDialog.vue'

const users = ref<User[]>([])
const loading = ref(false)
const search = ref('')

const logsDialog = ref(false)
const logsUserId = ref<number | null>(null)
const logsUserName = ref('')

const openLogsDialog = (user: User) => {
  logsUserId.value = user.id
  logsUserName.value = user.username
  logsDialog.value = true
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Nazwa użytkownika', key: 'username' },
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

// EDIT
const editDialog = ref(false)
const editedUser = reactive<Partial<User>>({})

const openEditDialog = (item: User) => {
  Object.assign(editedUser, item)
  editDialog.value = true
}

const closeEditDialog = () => {
  editDialog.value = false
  // reset editedUser
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
    
    // Update local list
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

// TOGGLE ACTIVE
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

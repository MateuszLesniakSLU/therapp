import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: LoginView,
      meta: { guestOnly: true },
    },

    {
      path: '/patient',
      meta: { role: 'patient' },
      component: () => import('../layouts/PatientLayout.vue'),
      children: [
        { path: '', component: () => import('../views/patient/PatientHome.vue') },
        { path: 'surveys', component: () => import('../views/patient/PatientSurveys.vue') },
        { path: 'surveys/:id', component: () => import('../views/patient/PatientSurveyFill.vue') },
        { path: 'doctors', component: () => import('../views/patient/PatientDoctors.vue') },
        { path: 'history', component: () => import('../views/patient/SurveyHistory.vue') },


        { path: 'settings', component: () => import('../views/patient/PatientSettings.vue') },
      ],
    },

    {
      path: '/doctor',
      meta: { role: 'therapist' },
      component: () => import('../layouts/DoctorLayout.vue'),
      children: [
        { path: '', component: () => import('../views/doctor/DoctorHome.vue') },
        { path: 'patients', component: () => import('../views/doctor/PatientList.vue') },
        { path: 'patients/:patientId', component: () => import('../views/doctor/PatientDetails.vue') },
        { path: 'patients/:patientId/survey/:surveyId', component: () => import('../views/doctor/PatientSurveyResponse.vue') },
        { path: 'settings', component: () => import('../views/doctor/DoctorSettings.vue') },
      ],
    },

    {
      path: '/admin',
      meta: { role: 'admin' },
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: '', component: () => import('../views/admin/AdminHome.vue') },
        { path: 'users', component: () => import('../views/admin/UserManagement.vue') },
        { path: 'settings', component: () => import('../views/admin/AdminSettings.vue') },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token && to.path !== '/login') return '/login'

  if (token && to.meta.guestOnly) {
    if (role === 'patient') return '/patient'
    if (role === 'therapist') return '/doctor'
    if (role === 'admin') return '/admin'
  }

  if (to.meta.role && to.meta.role !== role) return '/login'
})

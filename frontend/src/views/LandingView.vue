<template>
  <v-app>
    <v-app-bar flat color="transparent" class="px-4 py-2" style="backdrop-filter: blur(10px);">
      <div class="d-flex align-center cursor-pointer" @click="$router.push('/')">
        <v-icon icon="mdi-brain" color="primary" size="32" class="mr-2"></v-icon>
        <span class="text-h5 font-weight-bold text-primary">TherApp</span>
      </div>
      
      <v-spacer></v-spacer>
      
      <div class="d-none d-sm-flex align-center">
        <v-btn variant="text" to="/login" class="mr-2 text-none font-weight-bold">Zaloguj się</v-btn>
        <v-btn color="primary" variant="flat" to="/register" class="text-none font-weight-bold px-6" rounded="xl">
          Dołącz teraz
        </v-btn>
      </div>
    </v-app-bar>

    <v-main>
      <!-- Sekcja Hero -->
      <section class="hero-section d-flex align-center position-relative overflow-hidden">
        <div class="background-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>

        <v-container class="position-relative" style="z-index: 2;">
          <v-row align="center">
            <v-col cols="12" md="6">
              <v-chip color="primary" variant="tonal" class="mb-4 font-weight-bold" label>
                Zdrowie Psychiczne 2.0
              </v-chip>
              <h1 class="text-h2 font-weight-black mb-4 text-gradient pb-2">
                Odzyskaj równowagę i spokój ducha
              </h1>
              <p class="text-h6 text-medium-emphasis mb-8" style="line-height: 1.6;">
                TherApp to nowoczesna platforma łącząca pacjentów z terapeutami. 
                Monitoruj swoje samopoczucie, śledź postępy i bądź w stałym kontakcie ze specjalistą.
              </p>
              
              <div class="d-flex flex-wrap gap-4">
                <v-btn 
                  color="primary" 
                  size="x-large" 
                  rounded="xl" 
                  elevation="4" 
                  to="/register"
                  class="text-none font-weight-bold px-8 mr-4 mb-4"
                  append-icon="mdi-arrow-right"
                >
                  Zacznij za darmo
                </v-btn>
                <v-btn 
                  variant="outlined" 
                  color="primary" 
                  size="x-large" 
                  rounded="xl" 
                  to="/login"
                  class="text-none font-weight-bold px-8 mb-4 border-2"
                >
                  Mam już konto
                </v-btn>
              </div>


            </v-col>
            
            <v-col cols="12" md="6" class="d-none d-md-flex justify-center position-relative">
              <div class="hero-image-container">
                <v-card width="400" height="500" class="glass-card pa-4" theme="dark">
                   <div class="d-flex align-center mb-6">
                      <v-avatar color="primary" class="mr-3">JD</v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Jan Kowalski</div>
                        <div class="text-caption text-grey">Pacjent</div>
                      </div>
                   </div>
                   
                   <div class="text-h4 mb-2">Samopoczucie</div>
                   <div class="text-h2 font-weight-bold text-success mb-6">8.5/10</div>
                   
                   <div class="mb-4 mt-8 px-2" style="height: 180px">
                     <MoodChart
                        :labels="['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd']"
                        :data="[6, 7.5, 7, 8.5, 8, 9, 8.5]"
                        border-color="#2196F3"
                        gradient-start="rgba(33, 150, 243, 0.4)"
                        gradient-end="rgba(33, 150, 243, 0.05)" 
                        :height="180"
                     />
                   </div>
                   
                   <v-btn block color="primary" variant="tonal" rounded="lg" class="mt-8">Wypełnij ankietę</v-btn>
                </v-card>
                
                <v-card width="280" height="140" class="glass-card position-absolute pa-4" style="bottom: -20px; left: -40px;" theme="light">
                  <div class="d-flex align-center">
                    <v-icon color="success" size="32" class="mr-3 bg-green-lighten-4 rounded-circle pa-2">mdi-check</v-icon>
                    <div>
                      <div class="text-caption text-grey">Status leków</div>
                      <div class="text-h6 font-weight-bold">Przyjęte</div>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Sekcja Features -->
      <section id="features" class="py-16 bg-surface-variant">
        <v-container>
          <div class="text-center mb-16">
            <h2 class="text-h3 font-weight-bold mb-4">Wszystko czego potrzebujesz</h2>
            <p class="text-h6 text-medium-emphasis mw-700 mx-auto">
              Kompleksowe narzędzia zaprojektowane, aby wspierać terapię i monitorowanie zdrowia psychicznego.
            </p>
          </div>

          <v-row>
            <v-col cols="12" md="4">
              <v-card class="h-100 pa-6 hover-card" elevation="0" border>
                <div class="mb-4 d-inline-block bg-primary-lighten-4 pa-3 rounded-lg">
                  <v-icon color="primary" size="32">mdi-chart-timeline-variant</v-icon>
                </div>
                <h3 class="text-h5 font-weight-bold mb-3">Monitoring Nastroju</h3>
                <p class="text-body-1 text-medium-emphasis">
                  Śledź swoje samopoczucie każdego dnia. Analizuj trendy i identyfikuj czynniki wpływające na Twój nastrój dzięki intuicyjnym wykresom.
                </p>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card class="h-100 pa-6 hover-card" elevation="0" border>
                <div class="mb-4 d-inline-block bg-secondary-lighten-4 pa-3 rounded-lg">
                  <v-icon color="secondary" size="32">mdi-doctor</v-icon>
                </div>
                <h3 class="text-h5 font-weight-bold mb-3">Dla Terapeutów</h3>
                <p class="text-body-1 text-medium-emphasis">
                  Dostęp do danych pacjentów w czasie rzeczywistym. Lepsza diagnoza i skuteczniejsza terapia dzięki pełnemu obrazowi sytuacji.
                </p>
              </v-card>
            </v-col>

            <v-col cols="12" md="4">
              <v-card class="h-100 pa-6 hover-card" elevation="0" border>
                <div class="mb-4 d-inline-block bg-success-lighten-4 pa-3 rounded-lg">
                  <v-icon color="success" size="32">mdi-shield-check</v-icon>
                </div>
                <h3 class="text-h5 font-weight-bold mb-3">Bezpieczeństwo</h3>
                <p class="text-body-1 text-medium-emphasis">
                  Twoje dane są w pełni szyfrowane i bezpieczne. Ty decydujesz, kto ma do nich dostęp. Pełna zgodność z RODO.
                </p>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </section>

      <!-- Sekcja CTA -->
      <section class="py-16 position-relative overflow-hidden">
        <v-container>
          <v-card color="primary" theme="dark" class="px-8 py-16 rounded-xl text-center overflow-hidden position-relative">
            <div class="position-relative" style="z-index: 2;">
              <h2 class="text-h3 font-weight-bold mb-6">Gotowy na zmianę?</h2>
              <p class="text-h6 mb-8 text-grey-lighten-1 mx-auto" style="max-width: 600px;">
                Dołącz do TherApp już dziś i zacznij dbać o swoje zdrowie psychiczne z profesjonalnym wsparciem.
              </p>
              <v-btn 
                color="white" 
                variant="flat" 
                size="x-large" 
                rounded="xl" 
                to="/register"
                class="text-primary font-weight-bold px-10"
              >
                Załóż darmowe konto
              </v-btn>
            </div>
            
            <div class="blob-white active"></div>
          </v-card>
        </v-container>
      </section>

      <!-- Stopka -->
      <v-footer class="bg-surface pt-16 pb-8">
        <v-container>
           <v-row>
             <v-col cols="12" md="4">
               <div class="d-flex align-center mb-4">
                 <v-icon icon="mdi-brain" color="primary" size="24" class="mr-2"></v-icon>
                 <span class="text-h6 font-weight-bold">TherApp</span>
               </div>
               <p class="text-body-2 text-medium-emphasis mb-4" style="max-width: 300px;">
                 Twoje codzienne wsparcie w drodze do lepszego samopoczucia.
               </p>
             </v-col>
             
             <v-col cols="12" md="3">
               <div class="font-weight-bold mb-4">Menu</div>
               <div class="d-flex flex-column gap-2">
                 <a href="#features" class="text-body-2 text-decoration-none text-medium-emphasis mb-2">Funkcje</a>
                 <router-link to="/login" class="text-body-2 text-decoration-none text-medium-emphasis mb-2">Logowanie</router-link>
                 <router-link to="/register" class="text-body-2 text-decoration-none text-medium-emphasis mb-2">Rejestracja</router-link>
                 <a href="#" class="text-body-2 text-decoration-none text-medium-emphasis mb-2">Polityka Prywatności</a>
               </div>
             </v-col>

             <v-col cols="12" md="5">
               <div class="font-weight-bold mb-4">Masz pytania? Skontaktuj się z nami</div>
               <v-form @submit.prevent="sendMessage">
                 <v-row dense>
                    <v-col cols="12">
                      <v-text-field 
                        v-model="contactForm.email"
                        label="Twój email" 
                        variant="outlined" 
                        density="compact"
                        rounded="lg"
                        hide-details="auto"
                        class="mb-2"
                        bg-color="surface"
                        required
                        type="email"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea 
                        v-model="contactForm.message"
                        label="Wiadomość" 
                        variant="outlined" 
                        density="compact"
                        rounded="lg"
                        hide-details="auto"
                        rows="3"
                        class="mb-3"
                        bg-color="surface"
                        required
                      ></v-textarea>
                    </v-col>
                 </v-row>
                 
                 <v-alert v-if="contactSuccess" type="success" density="compact" variant="tonal" class="mb-3">
                   Wiadomość wysłana!
                 </v-alert>
                 <v-alert v-if="contactError" type="error" density="compact" variant="tonal" class="mb-3">
                   {{ contactError }}
                 </v-alert>

                 <v-btn 
                   type="submit"
                   color="primary" 
                   rounded="lg" 
                   block
                   :loading="contactLoading"
                 >
                   Wyślij wiadomość
                 </v-btn>
               </v-form>
             </v-col>
           </v-row>
           <v-divider class="my-8"></v-divider>
           <div class="text-center text-caption text-medium-emphasis">
             &copy; {{ new Date().getFullYear() }} TherApp. Wszystkie prawa zastrzeżone.
           </div>
        </v-container>
      </v-footer>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { API_URL } from '../config'
import MoodChart from '../components/MoodChart.vue'

const contactForm = ref({ email: '', message: '' })
const contactLoading = ref(false)
const contactSuccess = ref(false)
const contactError = ref<string | null>(null)

const sendMessage = async () => {
   if (!contactForm.value.email || !contactForm.value.message) return
   contactLoading.value = true
   contactError.value = null
   contactSuccess.value = false
   
   try {
     const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm.value)
     })
     
     if (!res.ok) {
       throw new Error('Błąd wysyłania')
     }
     
     contactSuccess.value = true
     contactForm.value = { email: '', message: '' }
   } catch (e) {
     contactError.value = 'Wystąpił błąd podczas wysyłania wiadomości.'
   } finally {
     contactLoading.value = false
   }
}
</script>

<style scoped>
.hero-section {
  min-height: 90vh;
  padding-top: 64px;
}

.text-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.background-blobs {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}

.blob-1 {
  width: 600px;
  height: 600px;
  background: rgb(var(--v-theme-primary));
  top: -100px;
  right: -100px;
  animation: float 10s infinite ease-in-out;
}

.blob-2 {
  width: 500px;
  height: 500px;
  background: rgb(var(--v-theme-secondary));
  bottom: -100px;
  left: -100px;
  animation: float 15s infinite ease-in-out reverse;
}

.glass-card {
  backdrop-filter: blur(16px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border-radius: 24px;
}

.hover-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 24px;
}

.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px -10px rgba(0, 0, 0, 0.1) !important;
  border-color: rgb(var(--v-theme-primary)) !important;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  50% { transform: translate(20px, 40px); }
  100% { transform: translate(0, 0); }
}

.floating-animation {
  animation: float 6s infinite ease-in-out;
}

.blob-white {
  position: absolute;
  width: 400px;
  height: 400px;
  background: white;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.1;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
}
</style>

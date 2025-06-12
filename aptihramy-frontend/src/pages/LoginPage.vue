<template>
    <v-col class="fill-height" fluid>
        <v-row align="center" justify="center" class="mb-4">
            <v-col cols="12" class="text-center">
                <h1 class="welcome-title">Welcome Back 👋</h1>
                <p class="subtitle">Please login to continue</p>
            </v-col>
        </v-row>

        <v-row align="center" justify="center">
            <v-col cols="12" sm="8" md="4">
                <v-card class="pa-6" elevation="10">
                    <v-card-title class="text-center text-h5 font-weight-bold">Login</v-card-title>

                    <v-card-text>
                        <v-form @submit.prevent="handleLogin" ref="formRef" v-model="formValid">
                            <v-text-field v-model="email" :rules="[requiredRule, emailRule]" label="Email" required
                                prepend-inner-icon="mdi-account"></v-text-field>

                            <v-text-field v-model="password" :rules="[requiredRule]" label="Password" type="password"
                                required prepend-inner-icon="mdi-lock"></v-text-field>

                            <v-btn type="submit" color="primary" block class="mt-4">
                                Login
                            </v-btn>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-col>
</template>



<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/core/api'
import { useErrorMessagesStore } from '@/core/stores/errorMessages';
import '../styles/main.css';
import { setToken } from '@/core/auth';


const errorMessagestore = useErrorMessagesStore()


const email = ref('')
const password = ref('')
const router = useRouter()
const formRef = ref()
const formValid = ref(true)

// Rules
const requiredRule = (v: string) => !!v || 'This field is required'
const emailRule = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Must be a valid email'


async function handleLogin() {
    const isValid = await formRef.value?.validate()
    if (!isValid.valid) return

    login(email.value, password.value)
        .then((token) => {
            setToken(token)
            errorMessagestore.addInfoMessage('Successfully logged in')
            router.push({ name: 'UploadPage' })
        })
        .catch(() => {
            errorMessagestore.addErrorMessage('Invalid email or password')
        })
}
</script>


<style scoped>
.fill-height {
    background: linear-gradient(135deg, var(--background-alt), var(--accent));

}

.welcome-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 0.25rem;
}

.subtitle {
    font-size: 1.125rem;
    color: var(--secondary);
}
</style>

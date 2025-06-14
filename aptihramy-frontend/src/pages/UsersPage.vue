<template>
    <TopBar title="Users" :go-back-btn="true" />

    <v-card class="user-card mx-auto" max-width="800px">
        <v-card-title>
            <h2 class="text-h6 font-weight-bold">All users</h2>
        </v-card-title>

        <!-- Column Headers -->
        <v-row class="user-header px-4 py-2">
            <v-col>Email</v-col>
            <v-col>Role</v-col>
            <v-col class="text-right">Actions</v-col>
        </v-row>
        <v-divider />

        <!-- User List -->
        <v-list>
            <v-list-item v-for="user in users" :key="user.id" class="user-row">
                <v-row align="center" class="px-4">
                    <v-col>
                        <span class="user-email font-weight-bold">{{ user.email }}</span>
                    </v-col>
                    <v-col>
                        <v-chip :color="user.is_superuser ? 'green' : 'grey'" variant="flat" text-color="white" small>
                            {{ user.is_superuser ? 'Superuser' : 'Member' }}
                        </v-chip>
                    </v-col>
                    <v-col class="text-right">
                        <v-btn icon="mdi-delete" variant="text" color="error" @click="deleteUser(user.id)" />
                    </v-col>
                </v-row>
                <v-divider />
            </v-list-item>
        </v-list>
        <v-btn @click="dialog = true" color="primary" block class="mt-4">Add user</v-btn>

    </v-card>

    <div class="text-center pa-4">
        <v-dialog v-model="dialog" max-width="500px">
            <v-card class="pa-6" max-width="500" elevation="3">
                <v-card-title class="text-h6 text-center">Create User</v-card-title>

                <v-form @submit.prevent="handleCreateUser" v-model="valid" ref="formRef">
                    <v-text-field v-model="email" label="Email" type="email" prepend-icon="mdi-email"
                        :rules="[rules.required, rules.email]" required />


                    <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" label="Password"
                        :rules="passwordRules" prepend-icon="mdi-lock"
                        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showPassword = !showPassword" required />

                    <v-text-field v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
                        label="Confirm Password" :rules="confirmPasswordRules" prepend-icon="mdi-lock-check"
                        :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                        @click:append-inner="showConfirmPassword = !showConfirmPassword" required />

                    <v-checkbox v-model="isSuperuser" label="Superuser" color="primary" class="mt-3" />

                    <v-btn class="mt-4" color="primary" type="submit" :disabled="!valid" block>
                        Create User
                    </v-btn>
                </v-form>
            </v-card>

        </v-dialog>
    </div>

</template>


<script setup lang="ts">
import { addUser, fetchCurrentUserInformation } from '@/core/api';
import { useErrorMessagesStore } from '@/core/stores/errorMessages';
import { UserInformation } from '@/types';
import { computed, onMounted, ref } from 'vue';


const users = ref<UserInformation[]>([])
const errorMessageStore = useErrorMessagesStore()
const dialog = ref(false)

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSuperuser = ref(false)
const valid = ref(false)
const formRef = ref()

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const rules = {
    required: (v: string) => !!v || 'This field is required',
    email: (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid',
}

const confirmPasswordRules = computed(() => [
    rules.required,
    (v: string) => v === password.value || 'Passwords must match',
])

const passwordRules = computed(() => [
    rules.required,
    (v: string) => confirmPassword.value === "" || v === confirmPassword.value || 'Passwords must match',
])

async function handleCreateUser() {
    if (!formRef.value?.validate()) return

    try {
        const response = await addUser(email.value, password.value, isSuperuser.value)
        errorMessageStore.addInfoMessage(`User ${response.email} successfully created`)
    } catch (error) {
        errorMessageStore.handleError(error)
    }

}

function deleteUser(id: string) {
    errorMessageStore.addInfoMessage("Implement delete user")
}

onMounted(async () => {
    try {
        const user = await fetchCurrentUserInformation()
        users.value = [user]
    } catch (error) {
        errorMessageStore.handleError(error)
    }
})
</script>

<style scoped>
.user-card {
    margin-top: 32px;
    padding-bottom: 16px;
}

.user-header {
    background-color: #f5f5f5;
    font-weight: 600;
    border-bottom: 1px solid #ccc;
}

.user-row {
    padding-top: 8px;
    padding-bottom: 8px;
}

.v-list-item {
    padding: 0;
}

.user-email {
    font-weight: 600;
}
</style>

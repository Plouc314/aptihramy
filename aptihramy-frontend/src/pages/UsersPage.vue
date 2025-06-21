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
                            {{ user.is_superuser ? 'Admin' : 'Member' }}
                        </v-chip>
                    </v-col>
                    <v-col class="text-right">
                        <v-btn icon="mdi-delete" variant="text" @click="openDeleteDialog(user)" />
                    </v-col>
                </v-row>
                <v-divider />
            </v-list-item>
        </v-list>
        <v-row justify="center">
            <v-btn rounded @click="createUserDialog = true" color="primary" class="add-user">Add user</v-btn>
        </v-row>

    </v-card>

    <div class="text-center pa-4">
        <v-dialog v-model="createUserDialog" max-width="500px">
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

                    <v-checkbox v-model="isSuperuser" label="Admin" color="primary" class="mt-3" />

                    <v-btn class="mt-4" color="primary" type="submit" :disabled="!valid" block>
                        Create User
                    </v-btn>
                </v-form>
            </v-card>
        </v-dialog>

        <v-dialog v-model="deleteUserConfirmationDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    Confirm deletion
                </v-card-title>

                <v-card-text>
                    Are you sure you want to delete this user ({{userToDelete.email}}) ?
                    <br>
                    This action cannot be undone.
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="deleteUserConfirmationDialog = false">Cancel</v-btn>
                    <v-btn color="error" @click="confirmDeleteUser">
                        Delete
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

</template>


<script setup lang="ts">
import { createUser, deleteUser, fetchAllUserInformation } from '@/core/api/users'
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import { UserInformation } from '@/types'
import { computed, onMounted, ref } from 'vue'
import "../styles/main.css"
// Reactive state
const users = ref<UserInformation[]>([])
const errorMessageStore = useErrorMessagesStore()
// Create user
const createUserDialog = ref(false)

// Delete user
const deleteUserConfirmationDialog = ref(false)
const userToDelete = ref<UserInformation | null>(null)

// Form fields
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isSuperuser = ref(false)
const valid = ref(false)
const formRef = ref()

// Password visibility toggles
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Validation rules
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
    (v: string) => confirmPassword.value === '' || v === confirmPassword.value || 'Passwords must match',
])

// Create user handler
async function handleCreateUser() {
    if (!formRef.value?.validate()) return

    try {
        const response = await createUser(email.value, password.value, isSuperuser.value)
        users.value = await fetchAllUserInformation()
        errorMessageStore.addInfoMessage(`User ${response.email} successfully created`)
    } catch (error) {
        errorMessageStore.handleError(error)
    }

    createUserDialog.value = false
}

// Open delete confirmation dialog
function openDeleteDialog(user: UserInformation) {
    userToDelete.value = user
    deleteUserConfirmationDialog.value = true
}

// Confirm user deletion
async function confirmDeleteUser() {
    if (userToDelete.value == null) return
    try {
        await deleteUser(userToDelete.value.id)
        users.value = await fetchAllUserInformation()
        errorMessageStore.addInfoMessage(`User ${userToDelete.value.email} successfully deleted`)
    } catch (error) {
        errorMessageStore.handleError(error)
    }

    deleteUserConfirmationDialog.value = false
    userToDelete.value = null
}

// Initial fetch of user data
onMounted(async () => {
    try {
        users.value = await fetchAllUserInformation()
    } catch (error) {
        errorMessageStore.handleError(error)
    }
})
</script>


<style scoped>
.user-card {
    margin-top: 32px;
    padding-bottom: 16px;
    background-color: var(--surface);

}

.user-header {
    background-color: var(--background);
    font-weight: 600;
    border-bottom: 1px solid var(--background)-alt;
}

.user-row {
    padding-top: 8px;
    padding-bottom: 8px;
}


.add-user {
    width: 80%;
    margin: 10px;
}

.user-email {
    font-weight: 600;
}
</style>

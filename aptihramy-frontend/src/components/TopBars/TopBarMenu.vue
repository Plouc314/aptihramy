<template>
    <v-menu activator="parent" location="bottom end" offset="4">
        <template #activator="{ props }">
            <v-btn color="secondary" v-bind="props" density="compact" icon="mdi-menu"></v-btn>
        </template>

        <!-- Dropdown content -->
        <v-list bg-color="surface-light" class="d-flex flex-column ga-1 pa-1" density="compact" rounded="lg"
            variant="text">
            <v-list-item prepend-icon="mdi-home" rounded="lg" title="Home" @click="goHome" />
            <v-list-item prepend-icon="mdi-upload" rounded="lg" title="Upload and Download" @click="goUpload" />
            <v-list-item v-if="is_superuser" prepend-icon="mdi-account-circle-outline" rounded="lg" title="Users"
                @click="goUsers" />
            <v-list-item v-if="is_superuser" prepend-icon="mdi-update" rounded="lg" title="Updates"
                @click="goUpdates" />

        </v-list>
    </v-menu>

    <v-dialog v-model="dialog" max-width="400">
        <v-card>
            <v-card-title class="text-h6">
                oui
            </v-card-title>

         
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { fetchCurrentUserInformation } from '@/core/api'
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import '../../styles/main.css';

const dialog = ref(false)
const router = useRouter()
const errorMessageStore = useErrorMessagesStore()
const is_superuser = ref(false)

function goHome() {
    router.push({ name: "HomePage" })
}

function goUpload() {
    router.push({ name: "UploadDownloadPage" })
}

function goUsers() {
    router.push({ name: "UsersPage" })
}

function goUpdates() {
    router.push({ name: "UpdatesPage" })
}

onMounted(async () => {
    try {
        const userInfo = await fetchCurrentUserInformation()
        is_superuser.value = userInfo.is_superuser
    } catch (err) {
        errorMessageStore.handleError(err)
    }

})
</script>
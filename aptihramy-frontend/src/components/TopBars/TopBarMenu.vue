<template>
    <v-menu activator="parent" location="bottom end" offset="4">
        <template #activator="{ props }">
            <v-btn v-bind="props" density="compact" icon="mdi-menu"></v-btn>
        </template>

        <!-- Dropdown content -->
        <v-list bg-color="surface-light" class="d-flex flex-column ga-1 pa-1" density="compact" rounded="lg"
            variant="text">
            <v-list-item prepend-icon="mdi-home" rounded="lg" title="Home" @click="goHome" />
            <v-list-item prepend-icon="mdi-upload" rounded="lg" title="Upload" @click="goUpload" />
            <v-list-item prepend-icon="mdi-account-circle-outline" rounded="lg" title="Users" @click="goHome" />
            <v-list-item prepend-icon="mdi-update" rounded="lg" title="Updates" @click="goHome" />

        </v-list>
    </v-menu>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'


const router = useRouter()


function goHome() {
    router.push({ name: "HomePage" })
}

function goUpload() {
    router.push({ name: "UploadPage" })
}
</script>
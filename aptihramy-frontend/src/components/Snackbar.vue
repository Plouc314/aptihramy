<template>
    <v-snackbar v-if="isSnackbarVisible" v-model="isSnackbarVisible" :timeout="4000" :color="currentSnackbar?.type">
        {{ currentSnackbar?.message }}
        <template v-slot:actions>
            <v-btn color="white" variant="text" @click="isSnackbarVisible = false">Close</v-btn>
        </template>
    </v-snackbar>
</template>

<script setup>
import { useSnackbarQueue } from '../core/snackbarQueue.ts';

const { isSnackbarVisible, currentSnackbar } = useSnackbarQueue();
</script>
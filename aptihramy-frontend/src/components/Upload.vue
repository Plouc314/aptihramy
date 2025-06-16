<template>
    <v-card class="upload-card">
        <v-card-title class="d-flex justify-space-between align-center">
            {{ props.title }}
            <v-btn icon="mdi-close" variant="text" @click="() => {
                file = null
                $emit('close')
            }"></v-btn>
        </v-card-title>

        <v-card-text>
            <v-row class="align-center">
                <v-col cols="9">
                    <v-file-upload icon="mdi-upload" title="Drag and Drop Here" density="compact" show-size
                        v-model="file" :accept="'.zip'" @update:modelValue="(files) => validateZip(file, files)" />
                </v-col>
                <v-col cols="3">
                    <v-btn color="primary" block @click="openFileDialog(input)">Browse files</v-btn>
                    <input ref="input" type="file" accept=".zip" hidden @change="handleFileChange" />
                </v-col>
            </v-row>

            <v-row class="mt-4" justify="space-between">
                <v-col cols="4">
                    <v-btn class="error-btn" variant="tonal" block @click="file = null">Clear</v-btn>
                </v-col>
                <v-col cols="4">
                    <v-btn variant="tonal" class="ok-btn" block @click="props.uploadFunction(file)">Upload</v-btn>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>
<script setup lang="ts">
import { useErrorMessagesStore } from '@/core/stores/errorMessages';
import { UploadProps } from '../types';
import { ref } from 'vue'

const errorMessageStore = useErrorMessagesStore();

const file = ref<File | null>(null);
const input = ref<HTMLInputElement | null>(null);

const props = defineProps<UploadProps>()

function validateZip(targetRef: File | null, files: File[] | null) {
    const file = files?.[0]
    if (file && !file.name.toLowerCase().endsWith('.zip')) {
        errorMessageStore.addErrorMessage('Please upload a .zip file');
        targetRef = null;
    } else {
        targetRef = file;
    }
}

function openFileDialog(refEl: HTMLInputElement | null) {
    refEl?.click();
}

function handleFileChange(event: Event) {
    const newFile = (event.target as HTMLInputElement).files?.[0];
    if (newFile && newFile.name.toLowerCase().endsWith('.zip')) {
        file.value = newFile;
    } else {
        errorMessageStore.addErrorMessage('Only .zip files are allowed');
    }
}

</script>

<style scoped>
.upload-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 16px;
}
</style>
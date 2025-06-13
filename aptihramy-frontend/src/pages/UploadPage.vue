<template>
    <v-col>
        <!-- Error Card -->
        <v-card v-if="diskError" class="mb-4" :color="diskReady ? 'info' : 'error'" variant="tonal">
            <v-card-text class="error-content d-flex align-center">
                <v-icon class="mr-2">mdi-alert-circle</v-icon>
                <span>{{ diskError }}</span>
            </v-card-text>
        </v-card>

        <!-- Upload Cards in Grid -->
        <v-row class="upload-container" dense>
            <v-col cols="12" lg="4">
                <Upload title="Upload tracking graph (.beaver file)" :upload-function="uploadBeaverFile" />
            </v-col>
            <v-col cols="12" lg="4">
                <Upload title="Upload raw dataframes" :upload-function="(f) => uploadDataframes(f, false)" />
            </v-col>
            <v-col cols="12" lg="4">
                <Upload title="Upload normalized dataframes" :upload-function="(f) => uploadDataframes(f, true)" />
            </v-col>
        </v-row>

        <!-- Navigation -->
        <v-btn color="primary" block class="mt-4" @click="goToHomePage">
            Go to home page
        </v-btn>
    </v-col>
</template>


<script setup lang="ts">
import { ref, onMounted, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useErrorMessagesStore } from '@/core/stores/errorMessages';
import {
    checkDiskDataStatus,
    uploadBeaverFileToServer,
    uploadDataframesToServer,
} from '@/core/api';

import Upload from '@/components/Upload.vue';


const router = useRouter();
const errorMessageStore = useErrorMessagesStore();


// Disk check status
const diskReady = ref(false)
const diskError = ref('');

async function checkDisk() {
    const result = await checkDiskDataStatus();
    diskReady.value = result.ready
    diskError.value = result.ready ? "No missing elements" : result.error
}
onMounted(async () => {
    await checkDisk()
});

// Upload logic
async function uploadBeaverFile(file: File | null) {
    if (!file) return;
    try {
        const diskError = await uploadBeaverFileToServer(file);
        await checkDisk()
        if (diskError) {
            errorMessageStore.addErrorMessage(diskError.detail);
        } else {
            errorMessageStore.addInfoMessage("Beaver file successfully uploaded");
        }

    } catch (err) {
        errorMessageStore.handleError(err);
    }
}

async function uploadDataframes(file: File | null, isNormalized: boolean) {
    if (!file) return;
    try {
        const diskError = await uploadDataframesToServer(file, isNormalized);
        await checkDisk()
        if (diskReady.value) {
            const label = isNormalized ? "Normalized dataframes" : "Raw dataframes";
            errorMessageStore.addInfoMessage(`${label} successfully uploaded`);
        }

        if (diskError) {
            errorMessageStore.addErrorMessage(diskError.detail)
        } else {
            const label = isNormalized ? "Normalized dataframes" : "Raw dataframes";
            errorMessageStore.addInfoMessage(`${label} successfully uploaded`);
        }

    } catch (err) {
        errorMessageStore.handleError(err);
    }
}

async function goToHomePage() {
    try {
        const response = await checkDiskDataStatus();
        if (response.ready) {
            router.push({ name: 'HomePage' });
        } else {
            diskError.value = response.error
            errorMessageStore.addErrorMessage(response.error);
        }
    } catch (err) {
        errorMessageStore.handleError(err);
    }
}
</script>

<style scoped>

.upload-container {
    margin: 40px auto;
    padding: 16px;
    row-gap: 24px;

}

.error-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.error-icon {
    font-size: 28px;
}

.error-text {
    font-weight: bold;
    font-size: 18px;
}
</style>

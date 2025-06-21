<template>
    <TopBar :go-back-btn="true" title="Upload and Download" />

    <v-container>
        <v-card v-if="diskError" class="mb-4" :color="diskReady ? 'info' : 'error'" variant="tonal">
            <v-card-text class="error-content d-flex align-center">
                <v-icon class="mr-2">mdi-alert-circle</v-icon>
                <span>{{ diskError }}</span>
            </v-card-text>
        </v-card>

        <v-row>
            <!-- Upload Section -->
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title class="text-h6 font-weight-bold">Upload Files</v-card-title>
                    <v-divider></v-divider>

                    <v-card-text>
                        <v-row class="font-weight-bold align-center row">
                            <v-col cols="6">Tracking Graph (.beaver)</v-col>
                            <v-col cols="6">
                                <v-btn color="primary" block @click="uploadGraph = true">
                                    <template #default>
                                        <v-icon start>mdi-upload</v-icon>
                                        Upload
                                    </template>
                                </v-btn>
                                <v-dialog v-model="uploadGraph" max-width="700">
                                    <Upload title="Upload tracking graph (.beaver file)"
                                        :upload-function="uploadBeaverFile" @close="uploadGraph = false" />
                                </v-dialog>
                            </v-col>
                        </v-row>

                        <v-row class="font-weight-bold align-center row">
                            <v-col cols="6">Raw Dataframes (.zip)</v-col>
                            <v-col cols="6">
                                <v-btn color="primary" block @click="uploadRawDataframes = true">
                                    <template #default>
                                        <v-icon start>mdi-upload</v-icon>
                                        Upload
                                    </template>
                                </v-btn>
                                <v-dialog v-model="uploadRawDataframes" max-width="700">
                                    <Upload title="Upload raw dataframes"
                                        :upload-function="(f) => uploadDataframes(f, false)"
                                        @close="uploadRawDataframes = false" />
                                </v-dialog>
                            </v-col>
                        </v-row>

                        <v-row class="font-weight-bold align-center">
                            <v-col cols="6">Normalized Dataframes (.zip)</v-col>
                            <v-col cols="6">
                                <v-btn color="primary" block @click="uploadNormalizedDataframes = true">
                                    <template #default>
                                        <v-icon start>mdi-upload</v-icon>
                                        Upload
                                    </template>
                                </v-btn>
                                <v-dialog v-model="uploadNormalizedDataframes" max-width="700">
                                    <Upload title="Upload normalized dataframes"
                                        :upload-function="(f) => uploadDataframes(f, true)"
                                        @close="uploadNormalizedDataframes = false" />
                                </v-dialog>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Download Section -->
            <v-col cols="12" md="6">
                <v-card>
                    <v-card-title class="text-h6 font-weight-bold">Download Files</v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                        <v-row class="font-weight-bold font-weight-bold row">
                            <v-col cols="6">Tracking Graph (.beaver)</v-col>
                            <v-col cols="6">
                                <v-btn color="secondary" block :loading="downloadGraphSent"
                                    :disabled="downloadGraphSent" @click="downloadGraph">
                                    <template #default>
                                        <v-icon start>mdi-download</v-icon>
                                        Download
                                    </template>
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-row class="font-weight-bold font-weight-bold row">
                            <v-col cols="6">Raw Dataframes (.zip)</v-col>
                            <v-col cols="6">
                                <v-btn color="secondary" block :loading="downloadRawDataframesSent"
                                    :disabled="downloadRawDataframesSent" @click="downloadDataframes(false)">
                                    <template #default>
                                        <v-icon start>mdi-download</v-icon>
                                        Download
                                    </template>
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-row class="font-weight-bold font-weight-bold">
                            <v-col cols="6">Normalized Dataframes (.zip)</v-col>
                            <v-col cols="6">
                                <v-btn color="secondary" block :loading="downloadNormalizedDataframesSent"
                                    :disabled="downloadNormalizedDataframesSent" @click="downloadDataframes(true)">
                                    <template #default>
                                        <v-icon start>mdi-download</v-icon>
                                        Download
                                    </template>
                                </v-btn> </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <!-- Navigation -->
        <v-row justify="end" class="mt-6">
            <v-btn class="ok-btn" @click="goToHomePage">
                Go to Home Page
                <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
        </v-row>
    </v-container>


</template>




<script setup lang="ts">
import { ref, onMounted, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useErrorMessagesStore } from '@/core/stores/errorMessages';


import Upload from '@/components/Upload.vue';
import { checkDiskDataStatus, downloadDataframesFromServer, downloadGraphFromServer, uploadBeaverFileToServer, uploadDataframesToServer } from '@/core/api/disk';


const router = useRouter();
const errorMessageStore = useErrorMessagesStore();
const uploadGraph = ref(false)
const uploadRawDataframes = ref(false)
const uploadNormalizedDataframes = ref(false)

const downloadGraphSent = ref(false)
const downloadRawDataframesSent = ref(false)
const downloadNormalizedDataframesSent = ref(false)
// Disk check status
const diskReady = ref(false)
const diskError = ref('');

async function checkDisk() {
    const result = await checkDiskDataStatus();
    diskReady.value = result.ready
    diskError.value = result.ready ? "No missing elements" : result.error
}


async function downloadGraph() {
    try {
        downloadGraphSent.value = true
        const blob = await downloadGraphFromServer()
        // Trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tracking_graph.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        errorMessageStore.addInfoMessage("Graph successfully downloaded");
        downloadGraphSent.value = false


    } catch (err) {
        errorMessageStore.handleError(err);
    }
}


async function downloadDataframes(isNormalized: boolean) {
    try {
        downloadNormalizedDataframesSent.value = isNormalized
        downloadRawDataframesSent.value = !isNormalized

        const blob = await downloadDataframesFromServer(isNormalized);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = isNormalized ? "normalized_dataframes.zip" : "dataframes.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        const label = isNormalized ? "Normalized dataframes" : "Raw dataframes";
        errorMessageStore.addInfoMessage(`${label} successfully downloaded`);

        downloadNormalizedDataframesSent.value = false
        downloadRawDataframesSent.value = false

    } catch (err) {
        errorMessageStore.handleError(err);
    }
}


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
        uploadGraph.value = false

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

        uploadRawDataframes.value = false
        uploadNormalizedDataframes.value = false

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

onMounted(async () => {
    try {
        await checkDisk()
    } catch (error) {
        errorMessageStore.handleError(error)
    }
});
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

.row {
    border-bottom: 1px solid var(--box-shadow);

}
</style>

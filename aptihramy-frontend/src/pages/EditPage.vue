<template>
    <v-btn @click="oui"></v-btn>
    <v-col>
        <TopBar title="Edit Page"></TopBar>
        <v-row v-if="trackerDiagnostics && !error">
            <v-col v-for="(rawCol, index) in COLUMNS_RAW" :key="index" cols="12" md="6">
                <v-card>
                    <v-card-title class="title-text">{{ COLUMN_RAW_TO_PRETTY.get(rawCol) }}</v-card-title>
                    <v-card-subtitle class="subtitle-text">
                    </v-card-subtitle>

                    <v-divider :thickness="3" color="info"></v-divider>


                </v-card>
            </v-col>
        </v-row>
    </v-col>
    <v-progress-circular v-if="!trackerDiagnostics && !error" indeterminate :size="80" :width="10"
        class="loading-spinner"></v-progress-circular>

    <div v-if="error" class="error-container">
        <v-card class="error-card">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span class="error-text">Person not found</span>
            </v-card-text>
        </v-card>
    </div>

</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { CLEANED, TEST_DATA } from "@/config/test_data";
import { COLUMNS_RAW, COLUMN_RAW_TO_PRETTY } from "@/config/constants";
import { useRoute, useRouter } from 'vue-router';
import TopBar from "@/components/TopBars/TopBar.vue";
import { EditPageProps } from "../types/types";
import { fetchRecordValues, fetchTrackerInformation, fetchTrackingChain } from "@/core/api";
import { ChainNode, TrackerDiagnostics } from "@/types/api_types";
import { useSnackbarQueue } from "@/core/snackbarQueue";

const props = defineProps<EditPageProps>();

const router = useRouter();
const route = useRoute();
const trackerDiagnostics = ref<TrackerDiagnostics | null>(null);
const trackingChain = ref<ChainNode[] | null>(null)
const error = ref(false)
const { addSnackbar, snackbarTypes } = useSnackbarQueue();

watch(trackerDiagnostics, newTrackedDiag => {
    for (let i = 0; i < newTrackedDiag.frames.length; i++) {
    }
    console.log("oui")
})


async function fetchAllRecords(newTrackingChain: ChainNode[]): Promise<Map<number, Map<string, (string | number)[]>>> {
    const resultsMap = new Map<number, Map<string, (string | number)[]>>();

    const promises = newTrackingChain.map(async ({ frame_idx, record_idx }) => {
        try {
            const data = await fetchRecordValues(frame_idx, record_idx);
            const records = data.records
            if (records) {
                resultsMap.set(frame_idx, records)
            }
        } catch (error) {
            console.error(`Failed to fetch for frame_idx: ${frame_idx}, record_idx: ${record_idx}`, error);
        }
    });

    await Promise.allSettled(promises);
    return resultsMap;
}



watch(trackingChain, newTrackingChain => {
    fetchAllRecords(newTrackingChain).then(data => {
        
        if (data) {
            trackerDiagnostics.value = data.diagnostic
        } else {
            addSnackbar("Person not found", snackbarTypes.ERROR)
            error.value = true
        }
    }
    ).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

})

function oui() {
    fetchTrackingChain(props.trackerID).then(data =>
        console.log(data)
    )
}

onMounted(() => {
    const param = props.trackerID
    fetchTrackerInformation(param)
        .then(data => {
            if (data.diagnostic) {
                trackerDiagnostics.value = data.diagnostic
            } else {
                addSnackbar("Person not found", snackbarTypes.ERROR)
                error.value = true
            }
        }
        ).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

    fetchTrackingChain(param)
        .then(data => {
            if (data.tracking_chain) {
                trackingChain.value = data.tracking_chain
            } else {
                addSnackbar("Chain not found", snackbarTypes.ERROR)
                error.value = true
            }
        }).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

})
</script>

<style scoped>
.subtitle-text {
    font-size: 18px;
    /* Increase font size */
    color: var(--text-primary);
    /* Optional: Adjust color */
}

.card-title {
    color: var(--primary)
}

.error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    /* Full viewport height */
    width: 100%;
    /* Full width */
}

.loading-spinner {
    position: fixed;
    /* Ensures it stays in the middle of the viewport */
    top: 50%;
    left: 50%;
}
</style>
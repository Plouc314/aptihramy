<template>
    <!--
    <v-col>
        <TopBar title="Edit Page"></TopBar>
        <v-row v-if="mostProbable && featureValues && !error">
            <v-col v-for="([rawFeature, values], index) in featureValues" :key="index" cols=" 12" md="6">
                <v-card>
                    <v-card-title class="title-text">{{ tfStore.getPrettyFromRaw(rawFeature) }}</v-card-title>
                    <v-card-subtitle class="subtitle-text">
                        {{ mostProbable.get(rawFeature) }}
                    </v-card-subtitle>

                    <v-divider :thickness="3" color="info"></v-divider>

                    <v-select v-model="selectedValues[rawFeature]" :items="values" label="Select an option"></v-select>

                </v-card>
            </v-col>
        </v-row>
    </v-col>
    <v-progress-circular v-if="!featureValues && !error" indeterminate :size="80" :width="10"
        class="loading-spinner"></v-progress-circular>

    <div v-if="error" class="error-container">
        <v-card class="error-card">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span class="error-text">Person not found</span>
            </v-card-text>
        </v-card>
    </div>
   -->

</template>

<script setup lang="ts">
// import { ref, reactive, computed, onMounted, watch } from "vue";
// import { CLEANED, TEST_DATA } from "@/config/test_data";
// import { COLUMNS_RAW, COLUMN_RAW_TO_PRETTY } from "@/config/constants";
// import { useRoute, useRouter } from 'vue-router';
// import TopBar from "@/components/TopBars/TopBar.vue";
// import { EditPageProps } from "../types/types";
// import { fetchRecordValues, fetchTrackerInformation, fetchTrackingChain } from "@/core/api";
// import { ChainNode, FeatureValues, TrackerDiagnostics } from "@/types/api_types";
// import { useSnackbarQueue } from "@/core/snackbarQueue";
// import { trackedFeaturesStore } from "@/core/stores/trackedFeatures";

// const props = defineProps<EditPageProps>();

// const router = useRouter();
// const route = useRoute();
// const trackerDiagnostics = ref<TrackerDiagnostics | null>(null);
// const error = ref(false)
// const { addSnackbar, snackbarTypes } = useSnackbarQueue();

// const tfStore = trackedFeaturesStore()
// const selectedValues = ref<Map<string, string | number>>(new Map())


// watch(tfStore.getTrackedFeatures, trackedFeaturesStore => {
//     if (trackedFeaturesStore) {
//         tfStore.getTrackedFeatures.pretty_features.forEach(f => selectedValues.value.set(f, ""))
//     }

// })

// async function fetchAllRecords(newTrackingChain: ChainNode[]): Promise<Map<number, FeatureValues>> {
//     const resultsMap = new Map<number, FeatureValues>();
//     const promises = newTrackingChain.map(async ({ frame_idx, record_idx }) => {
//         try {
//             const data = await fetchRecordValues(frame_idx, record_idx);
//             const records = data.records
//             if (records) {
//                 resultsMap.set(frame_idx, records)
//             }
//         } catch (error) {
//             console.error(`Failed to fetch for frame_idx: ${frame_idx}, record_idx: ${record_idx}`, error);
//         }
//     });

//     await Promise.allSettled(promises);
//     return resultsMap;
// }

// const featureValues = ref<FeatureValues>(null)
// const mostProbable = computed<Map<string, string | number>>(() => {
//     if (!trackerDiagnostics.value || !tfStore) {
//         return null
//     }

//     const m = new Map<string, string | number>()
//     trackerDiagnostics.value.frames[trackerDiagnostics.value.frames.length - 1].memory.forEach(
//         (values, index) => m.set(tfStore.getTrackedFeatures.raw_features[index], values[0])
//     )

//     return m
// }
// )

// watch(trackerDiagnostics, newtrackerDiagnostics => {
//     if (!newtrackerDiagnostics) {
//         return []
//     }

//     const nodes: ChainNode[] = []
//     for (const a of newtrackerDiagnostics.frames) {
//         for (const b of a.records) {
//             nodes.push({ frame_idx: a.frame_idx, record_idx: b.record_idx })
//         }
//     }

//     const temp: FeatureValues = new Map()
//     fetchAllRecords(nodes).then(data => {
//         data.forEach((recordValues, frameidx) => {
//             for (const feature in recordValues) {
//                 const values = recordValues[feature]
//                 const currentValues = temp.get(feature)

//                 if (currentValues) {
//                     currentValues.push(...values)
//                     const currentValuesSet = new Set(currentValues.filter(a => a != null))
//                     temp.set(feature, Array.from(currentValuesSet))
//                 } else {
//                     temp.set(feature, values)

//                 }
//             }
//         })
//         featureValues.value = temp
//     })
// })


// onMounted(() => {
//     const param = props.trackerID
//     fetchTrackerInformation(param)
//         .then(data => {
//             if (data.diagnostic) {
//                 trackerDiagnostics.value = data.diagnostic
//             } else {
//                 addSnackbar("Person not found", snackbarTypes.ERROR)
//                 error.value = true
//             }
//         }).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

// })
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
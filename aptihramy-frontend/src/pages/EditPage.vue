<template>


    <v-col>
        <TopBar title="Edit Page"></TopBar>
        <v-expansion-panels v-model="expandedFeatureIndexes" multiple>
            <v-expansion-panel v-for="(prettyFeature, featureIndex) in allFeatures" :key="featureIndex"
                :title="prettyFeature">
                <v-expansion-panel-text>
                    {{ prettyFeature }}
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
        <div>{{ a }}</div>
        <!--
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
    </v-col>



</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { COLUMNS_RAW, COLUMN_RAW_TO_PRETTY } from "@/config/constants";
import { useRoute, useRouter } from 'vue-router';
import TopBar from "@/components/TopBars/TopBar.vue";
import { EditPageProps, RawNormalizedValue } from "../types/types";
import { useSnackbarQueue } from "@/core/snackbarQueue";
import { trackedFeaturesStore } from "@/core/stores/trackedFeatures";
import { fetchMaterializedFrames } from "@/core/api";
import { MaterializedTrackerFrame } from "@/types/api_types";
import { trackedYearsStore } from "@/core/stores/trackedYears";

const props = defineProps<EditPageProps>();
const materializedTrackerFrames = ref<MaterializedTrackerFrame[] | null>(null)
const error = ref(false)
const { addSnackbar, snackbarTypes } = useSnackbarQueue();


const tfStore = trackedFeaturesStore()
tfStore.fetchTrackedFeatures()
const tyStore = trackedYearsStore()
tyStore.fetchTrackedYears()

const allFeatures = computed(() => tfStore.getTrackedFeatures ? tfStore.getTrackedFeatures.pretty_features : null)
const expandedFeatureIndexes = ref([])

// const expandedRawFeatures = computed(() =>
//     expandedIndex.value.map(featureIndex => tfStore.getTrackedFeature(featureIndex, false))
// )

const a = computed(() => {
    if (materializedTrackerFrames.value == null) {
        return new Map()
    }
    // feature -> Year -> values
    const featureYearValues = new Map<string, Map<number, RawNormalizedValue[]>>()

    for (let featureIndex = 0; featureIndex < expandedFeatureIndexes.value.length; featureIndex++) {
        const prettyFeature = tfStore.getTrackedFeature(featureIndex)

        const yearValues = new Map<number, RawNormalizedValue[]>()
        for (let i = 0; i < materializedTrackerFrames.value.length; i++) {
            const frame = materializedTrackerFrames.value[i]

            if (frame.matching_record_idx == null) {
                continue
            }

            const allFeatureValues: RawNormalizedValue[] = frame.records.map(r => { return { rawValue: r.record_raw_values[featureIndex], normalizedValue: r.record_normalized_values[featureIndex] } })
            yearValues.set(tyStore.getYearFromFrameIdx(frame.frame_idx), allFeatureValues)
        }

        featureYearValues.set(prettyFeature, yearValues)

    }

    return featureYearValues
})



onMounted(() => {
    const param = props.trackerID

    fetchMaterializedFrames(param)
        .then(data => {
            if (data.frames) {
                console.log(data.frames)
                materializedTrackerFrames.value = data.frames
            } else {
                addSnackbar("Person not found", snackbarTypes.ERROR)
                error.value = true
            }
        }
        ).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))
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
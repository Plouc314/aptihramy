<template>
    <v-col v-if="featureYearValues">
        <TopBarEditPage title="Edit Page" :save="saveSelected"></TopBarEditPage>
        <v-expansion-panels v-model="expandedFeatureIndexes" multiple>
            <v-expansion-panel v-for="(prettyFeature, featureIndex) in allFeatures" :key="featureIndex">
                <v-expansion-panel-title class="expansion-title">
                    {{ prettyFeature }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <EditMetrics :pretty-feature="prettyFeature" :year-values="featureYearValues.get(prettyFeature)"
                        :updated-values="updatedValues.get(prettyFeature)" @update-values="updateValues">
                    </EditMetrics>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-col>

    <v-progress-circular v-if="!featureYearValues && !error" indeterminate :size="80" :width="10"
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
import { ref, computed, onMounted } from "vue";
import EditMetrics from "@/components/EditMetrics.vue";
import { EditPageProps, RawNormalizedValue } from "../types/types";
import { useSnackbarQueue } from "@/core/snackbarQueue";
import { trackedFeaturesStore } from "@/core/stores/trackedFeatures";
import { fetchMaterializedFrames } from "@/core/api";
import { MaterializedTrackerFrame } from "@/types/api_types";
import { trackedYearsStore } from "@/core/stores/trackedYears";
import '../styles/main.css';
import TopBarEditPage from "@/components/TopBars/TopBarEditPage.vue";


const props = defineProps<EditPageProps>();
const error = ref(false)
const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const tfStore = trackedFeaturesStore()
tfStore.fetchTrackedFeatures()
const tyStore = trackedYearsStore()
tyStore.fetchTrackedYears()

const allFeatures = computed(() => tfStore.getTrackedFeatures ? tfStore.getTrackedFeatures.pretty_features : null)
const expandedFeatureIndexes = ref([])
const frames = ref<MaterializedTrackerFrame[] | null>(null)

// pretty feature -> year -> updated value
const updatedValues = ref(new Map<string, Map<number, string | number>>())

const featureYearValues = computed(() => {
    if (frames.value == null || allFeatures.value == null) {
        return null
    }
    // feature -> Year -> values
    const featureYearValues = new Map<string, Map<number, RawNormalizedValue[]>>()

    for (let featureIndex = 0; featureIndex < allFeatures.value.length; featureIndex++) {
        const prettyFeature = tfStore.getTrackedFeature(featureIndex)

        const yearValues = new Map<number, RawNormalizedValue[]>()
        for (let i = 0; i < frames.value.length; i++) {
            const frame = frames.value[i]

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


function updateValues(prettyFeature: string, yearValues: Map<number, string | number>) {
    updatedValues.value.set(prettyFeature, yearValues)
}

function saveSelected() {
    addSnackbar("To be implemented", snackbarTypes.INFO)
}

onMounted(() => {
    const param = props.trackerID

    fetchMaterializedFrames(param)
        .then(data => {
            if (data.frames) {
                frames.value = data.frames


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

.expansion-title {
    font-size: 1.25rem;
    /* or any size you want */
    font-weight: 500;
    color: var(--text-color);
}
</style>
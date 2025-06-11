<template>
    <v-col>
        <TopBarEditPage title="Edit Page" :save="saveSelectedValues" />
        <v-progress-circular v-if="!featureYearValues && !error" indeterminate :size="80" :width="10"
            class="loading-spinner" />
        <v-card v-else-if="error" class="error-card">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span>Person not found</span>
            </v-card-text>
        </v-card>
        <v-expansion-panels v-else v-model="expandedFeatureIndexes" multiple>
            <v-expansion-panel v-for="feature in allPrettyFeatures" :key="feature">
                <v-expansion-panel-title>{{ feature }}</v-expansion-panel-title>
                <v-expansion-panel-text>
                    <EditMetrics :pretty-feature="feature" :frame-idx-values="featureYearValues.get(feature)"
                        :updated-values="extractUpdatedValues(feature)" @update-values="updateValues" />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
    </v-col>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import EditMetrics from "@/components/EditMetrics.vue";
import TopBarEditPage from "@/components/TopBars/TopBarEditPage.vue";
import { EditPageProps, FeatureYearMatchMap, IdxRawNormalizedValue, FeatureMatchForYear, FrameIdxRecordIdxValue } from "../types/types";
import { fetchMaterializedFrames, postUpdateBatch } from "@/core/api";
import { MaterializedTrackerFrame } from "@/types/api_types";
import { useErrorMessagesStore } from "@/core/stores/errorMessages";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import "../styles/main.css";
import { UpdateBatch, UpdateEntry } from "@/types/update_types";

const props = defineProps<EditPageProps>();
const errorMessageStore = useErrorMessagesStore();
const trackedFeaturesStore = useTrackedFeaturesStore();


const error = ref(false);
const frames = ref<MaterializedTrackerFrame[] | null>(null);

const expandedFeatureIndexes = ref<number[]>([]);

const allPrettyFeatures = computed(() => trackedFeaturesStore.getTrackedFeatures?.pretty_features ?? []);
const updatedValues = ref(new Map<string, Map<number, [number, string | number]>>());

function updateValues(prettyFeature: string, frameRecordValue: FrameIdxRecordIdxValue[]) {
    const values = updatedValues.value.get(prettyFeature) || new Map<number, [number, string | number]>();
    frameRecordValue.forEach(v => {
        values.set(v.frameIdx, [v.recordIdx, v.value]);
    });
    updatedValues.value.set(prettyFeature, values);
}

function extractUpdatedValues(
    feature: string
): Map<number, string | number> {
    const recordMap = updatedValues.value.get(feature)
    if (!recordMap) return new Map();
    return new Map(
        Array.from(recordMap.entries()).map(([frameIdx, [, value]]) => [frameIdx, value])
    );
}

async function saveSelectedValues() {
    try {
        const entries: UpdateEntry[] = [];

        updatedValues.value.forEach((frameIdxRecordIdxValue, feature) => {
            Array.from(frameIdxRecordIdxValue.entries()).forEach(([frameIdx, [recordIdx, value]]) => {
                entries.push({
                    frame_idx: frameIdx,
                    record_idx: recordIdx,
                    field_idx: trackedFeaturesStore.getTrackedFeatureIndex(feature),
                    value: value,
                });
            });
        });

        const batch: UpdateBatch = {
            author: "john.doe@example.com",
            accepted: false,
            timestamp: new Date().toISOString(),
            entries,
        };

        await postUpdateBatch(batch);
        errorMessageStore.addInfoMessage("Changes successfully stored");
    } catch (err) {
        errorMessageStore.handleError(err);
        error.value = true;
    }
}

const featureYearValues = computed(() => {
    if (!frames.value || !allPrettyFeatures.value) return null;

    // Feature -> frame index -> raw and normalized of the matching record and the candidates records
    const result: FeatureYearMatchMap = new Map()
    allPrettyFeatures.value.forEach((feature, featureIndex) => {
        // frame index -> raw and normalized of the matching record and the candidates records
        const frameIdxValues = new Map<number, FeatureMatchForYear>();
        frames.value!.forEach(frame => {
            if (frame.matching_record_idx == null) return;

            const values = frame.records.map(r => ({
                recordIdx: r.record_idx,
                rawValue: r.record_raw_values[featureIndex],
                normalizedValue: r.record_normalized_values[featureIndex],
            }));
            frameIdxValues.set(frame.frame_idx, { matchingRecordIndex: frame.matching_record_idx, candidates: values });
        });
        result.set(feature, frameIdxValues);
    })
    return result;
});

onMounted(async () => {
    try {
        const { frames: fetchedFrames } = await fetchMaterializedFrames(props.trackerID);
        frames.value = fetchedFrames ?? null;

        if (!fetchedFrames) {
            error.value = true;
            errorMessageStore.addErrorMessage("Person not found");
        }
    } catch (err) {
        errorMessageStore.handleError(err);
        error.value = true;
    }
});

</script>

<style scoped>
.error-card {
    max-width: 400px;
    margin: 20px auto;
}

.error-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
}

.error-icon {
    color: var(--error);
}

.loading-spinner {
    display: block;
    margin: 40px auto;
}

.v-expansion-panel-title {
    font-size: 1.25rem;
    font-weight: 500;
}
</style>
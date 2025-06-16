<template>
    <v-col>
        <TopBar title="Edit page" :goBackBtn="true">
            <v-btn color="secondary" size="large" class="mx-2" @click="saveSelectedValues">
                <template v-slot:prepend>
                    <v-icon>mdi mdi-content-save</v-icon>
                </template>
                Save
            </v-btn>
        </TopBar>

        <v-card v-if="error" class="error-card">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span>Person not found</span>
            </v-card-text>
        </v-card>

        <v-progress-circular v-else-if="featureYearValues.size === 0" indeterminate :size="80" :width="10"
            class="loading-spinner" />
        <v-expansion-panels v-else v-model="expandedFeatureIndexes" multiple>
            <v-expansion-panel v-for="feature in allPrettyFeatures" :key="feature">
                <v-expansion-panel-title>
                    <v-row align="center">
                        <v-col cols="4" class="text-subtitle-1 font-weight-medium">
                            {{ feature }}
                        </v-col>

                        <v-spacer></v-spacer>

                        <v-col cols="auto">
                            <v-btn color="error" variant="tonal" class="me-2" @click.stop="triggerReset(feature)">
                                Reset to default values (normalized)
                            </v-btn>
                            <v-btn color="success" variant="tonal" @click.stop="triggerSave(feature)">
                                Save
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <EditMetrics :ref="(el) => setEditMetricsRef(feature, el)" :pretty-feature="feature"
                        :frame-idx-values="featureYearValues.get(feature)"
                        :updated-values="extractUpdatedValues(feature)" @update-values="updateValues" />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

    </v-col>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import EditMetrics from "@/components/EditMetrics.vue";
import TopBar from "@/components/TopBars/TopBar.vue";
import { fetchCurrentUserInformation, fetchMaterializedFrames, postUpdateBatch } from "@/core/api";
import { MaterializedTrackerFrame } from "@/types/api/api";
import { useErrorMessagesStore } from "@/core/stores/errorMessages";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import "../styles/main.css";
import { UpdateBatch, UpdateEntry } from "@/types/api/update";
import { EditPageProps, FeatureMatchForYear, FeatureYearMatchMap, FrameIdxRecordIdxValue } from "../types";
import { useTrackedYearsStore } from "@/core/stores/trackedYears";

const props = defineProps<EditPageProps>();
const errorMessageStore = useErrorMessagesStore();
const trackedFeaturesStore = useTrackedFeaturesStore();
const trackedYearsStore = useTrackedYearsStore()


const editMetricsRefs = ref<Record<string, any>>({});

function setEditMetricsRef(feature: string, el: any) {
    if (el) {
        editMetricsRefs.value[feature] = el;
    }
}

function triggerReset(feature: string) {
    editMetricsRefs.value[feature]?.resetToDefault?.();
}

function triggerSave(feature: string) {
    editMetricsRefs.value[feature]?.save?.();
}

const error = ref(false);
const frames = ref<MaterializedTrackerFrame[] | null>(null);

const expandedFeatureIndexes = ref<number[]>([]);

const allPrettyFeatures = computed(() => trackedFeaturesStore.getTrackedFeatures?.pretty_features ?? []);
// feature -> frame idx -> [record idx, updated value]
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

        const userInfo = await fetchCurrentUserInformation()
        const batch: UpdateBatch = {
            id: undefined,
            author: userInfo.email,
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

const featureYearValues = computed<FeatureYearMatchMap>(() => {
    if (!frames.value || !allPrettyFeatures.value) return new Map();

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
        await trackedFeaturesStore.fetchAndStoreTrackedFeatures()
        await trackedYearsStore.fetchAndStoreTrackedYears()
        const fetchedFrames = await fetchMaterializedFrames(props.trackerID);
        console.log(fetchedFrames)
        frames.value = fetchedFrames.frames;
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
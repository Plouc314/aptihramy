<template>
    <v-col>
        <TopBar title="Edit page" :goBackBtn="true">
            <v-btn :loading="isSaving" prepend-icon="mdi-content-save" variant="text" color="secondary" size="large"
                class="mx-2" @click="saveSelectedValues">
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
            <v-expansion-panel v-for="prettyFeature in allPrettyFeatures" :key="prettyFeature">
                <v-expansion-panel-title>
                    <v-row align="center">
                        <v-col cols="4" class="text-subtitle-1 font-weight-medium">
                            {{ prettyFeature }}
                        </v-col>

                        <v-spacer></v-spacer>

                        <v-col cols="auto">
                            <v-btn color="error" variant="tonal" class="me-2" @click.stop="triggerReset(prettyFeature)">
                                Reset to default values
                            </v-btn>

                        </v-col>
                    </v-row>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <EditMetrics :ref="(el) => setEditMetricsRef(prettyFeature, el)" :pretty-feature="prettyFeature"
                        :frame-idx-values="featureYearValues.get(prettyFeature)"
                        :updated-values="updatedValues.get(prettyFeature)" @update-values="updateValues" />
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

    </v-col>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { DateTime } from 'luxon';
import EditMetrics from "@/components/EditMetrics.vue";
import TopBar from "@/components/TopBars/TopBar.vue";
import { MaterializedTrackerFrame } from "@/types/api/api";
import { useErrorMessagesStore } from "@/core/stores/errorMessages";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import "../styles/main.css";
import { UpdateBatch, UpdateEntry } from "@/types/api/update";
import { EditPageProps, FeatureMatchForYear, FeatureYearMatchMap } from "../types";
import { useTrackedYearsStore } from "@/core/stores/trackedYears";
import { RefSymbol } from "@vue/reactivity";
import { fetchCurrentUserInformation } from "@/core/api/users";
import { postUpdateBatch } from "@/core/api/batch";
import { fetchMaterializedFrames } from "@/core/api/api";

const props = defineProps<EditPageProps>();
const errorMessageStore = useErrorMessagesStore();
const trackedFeaturesStore = useTrackedFeaturesStore();
const trackedYearsStore = useTrackedYearsStore()
const isSaving = ref(false)

const editMetricsRefs = ref<Record<string, any>>({});

function setEditMetricsRef(feature: string, el: any) {
    if (el) {
        editMetricsRefs.value[feature] = el;
    }
}

function triggerReset(feature: string) {
    editMetricsRefs.value[feature]?.resetToDefault?.();
}

const error = ref(false);
const frames = ref<MaterializedTrackerFrame[] | null>(null);

const expandedFeatureIndexes = ref<number[]>([]);

const allPrettyFeatures = computed(() => trackedFeaturesStore.getTrackedFeatures?.pretty_features ?? []);
// feature -> frameIdx ->  updated value
const updatedValues = ref(new Map<string, Map<number, string | number>>());
const lastUpdatedValues = ref(new Map<string, Map<number, string | number>>());

function updateValues(prettyFeature: string, frameRecordValue: Map<number, string | number>) {
    updatedValues.value.set(prettyFeature, frameRecordValue)
}


/**
 * Compares the updated values with the last updated feature values to check
 * if any changes have been made by the user. Prevents the user from creating the same batch multiple times.
 *
 * @returns {boolean} - Returns `true` if all updated values are identical
 *                      to the original (normalized) values, `false` otherwise.
 */
function oldpdateUAndNewUpdateAreEqual(): boolean {
    let equal = true;
    // Iterate through each updated feature and its associated frame/value map
    updatedValues.value.forEach((updatedFrameMap, feature) => {
        if (!equal) return; // Stop processing if already determined not equal
        // Get the original values for this feature
        const originalFrameMap = lastUpdatedValues.value.get(feature);
        if (!originalFrameMap) {
            equal = false;
            return;
        }
        // Compare each updated value to its original counterpart
        updatedFrameMap.forEach((updatedValue, frameIdx) => {
            const oldValue = originalFrameMap.get(frameIdx);
            if (!oldValue) {
                equal = false;
                return;
            }
            if (oldValue !== updatedValue) {
                equal = false
                return
            }
        });
    });
    return equal;
}

/**
 * Compares the updated values with the original feature values to check
 * if any changes have been made by the user.
 *
 * @returns {boolean} - Returns `true` if all updated values are identical
 *                      to the original (normalized) values, `false` otherwise.
 */
function originalAndUpdatedAreEqual(): boolean {
    let equal = true;

    // Iterate through each updated feature and its associated frame/value map
    updatedValues.value.forEach((updatedFrameMap, feature) => {
        if (!equal) return; // Stop processing if already determined not equal

        // Get the original values for this feature
        const originalFrameMap = featureYearValues.value.get(feature);
        if (!originalFrameMap) {
            equal = false;
            return;
        }

        // Compare each updated value to its original counterpart
        updatedFrameMap.forEach((updatedValue, frameIdx) => {
            const original = originalFrameMap.get(frameIdx);
            if (!original) {
                equal = false;
                return;
            }

            // Find the matching record based on record index
            const matchingRecord = original.candidates.find(
                c => c.recordIdx === original.matchingRecordIndex
            );

            // If record not found or values differ, set equal to false
            if (!matchingRecord || matchingRecord.normalizedValue !== updatedValue) {
                equal = false;
                return
            }
        });
    });

    return equal;
}


async function saveSelectedValues() {
    if (updatedValues.value.size == 0 || originalAndUpdatedAreEqual() || oldpdateUAndNewUpdateAreEqual()) {
        errorMessageStore.addInfoMessage("No changes to save");
        return
    }
    isSaving.value = true;
    try {
        const entries: UpdateEntry[] = [];
        updatedValues.value.forEach((frameIdxValue, prettyFeature) => {
            const originalFrameMap = featureYearValues.value.get(prettyFeature);
            if (!originalFrameMap) return;

            const fieldIdx = trackedFeaturesStore.getTrackedFeatureIndex(prettyFeature);

            frameIdxValue.forEach((value, frameIdx) => {
                const original = originalFrameMap.get(frameIdx);
                if (!original) return;

                entries.push({
                    frame_idx: frameIdx,
                    record_idx: original.matchingRecordIndex,
                    field_idx: fieldIdx,
                    value: value,
                });
            });
        });

        const userInfo = await fetchCurrentUserInformation()
        const batch: UpdateBatch = {
            id: undefined,
            author: userInfo.email,
            accepted: false,
            timestamp: DateTime.local().toISO(),
            entries,
        };


        await postUpdateBatch(batch);
        lastUpdatedValues.value = updatedValues.value
        errorMessageStore.addInfoMessage("Changes successfully stored");
    } catch (err) {
        errorMessageStore.handleError(err);
        error.value = true;
    } finally {
        isSaving.value = false;
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
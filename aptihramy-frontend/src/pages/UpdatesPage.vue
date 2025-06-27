<template>
    <TopBar title="Pending updates" :go-back-btn="true"></TopBar>
    <v-col>
        <!-- Loading spinner shown while data is being fetched -->
        <v-progress-circular v-if="fetching" indeterminate :size="80" :width="10"
            class="loading-spinner"></v-progress-circular>

        <!-- If no update batches are found -->
        <v-card v-else-if="updateBatches.length === 0">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span class="error-text">No pending updates</span>
            </v-card-text>
        </v-card>

        <!-- List of pending update batches -->
        <v-expansion-panels v-model="expandedIndexes" multiple v-else>
            <v-expansion-panel v-for="(batch, batchIdx) in updateBatches" :key="batchIdx" class="expansion-bg">

                <!-- If the batch has no entries -->
                <v-card v-if="batch.entries.length === 0">
                    <v-card-text class="error-content">
                        <v-icon class="error-icon">mdi-alert-circle</v-icon>
                        <span class="error-text">Batch is empty</span>
                    </v-card-text>
                </v-card>

                <!-- Valid batch with entries -->
                <v-card v-else>
                    <v-expansion-panel-title>
                        <v-row align="center">
                            <v-col cols="2" class="text-subtitle-1 font-weight-medium">
                                Author: {{ batch.author }}
                            </v-col>
                            <v-col class="text-subtitle-1 font-weight-medium">
                                ({{ formatTimestamp(batch.timestamp) }})
                            </v-col>

                            <v-spacer></v-spacer>

                            <v-col cols="auto">
                                <v-btn color="error" variant="tonal" class="me-2"
                                    @click.stop="openConfirmDialog('reject', batch.id)">
                                    Reject
                                </v-btn>
                                <v-btn color="success" variant="tonal"
                                    @click.stop="openConfirmDialog('accept', batch.id)">
                                    Accept
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-expansion-panel-title>

                    <!-- Batch entry content -->
                    <v-expansion-panel-text>
                        <!-- Table header -->
                        <v-row class="table-header-row">
                            <v-col
                                v-for="(column, index) in ['Year', 'Index in file', 'Modified feature', 'Original Raw Value', 'Original Normalized Value', 'Proposed New Value']"
                                :key="index" class="table-header-text">
                                {{ column }}
                            </v-col>
                        </v-row>
                        <v-row class="table-data-row" v-for="(entry, index) of batch.entries"
                            v-if="originalValues.size != 0" :key="index">
                            <v-col class="table-data-text">
                                {{ years.getYearFromFrameIdx(entry.frame_idx) }}
                            </v-col>
                            <v-col class="table-data-text">
                                {{ entry.record_idx + 2 }}
                            </v-col>
                            <v-col class="table-data-text">
                                {{ trackedFeatures.getTrackedFeature(entry.field_idx) }}
                            </v-col>
                            <v-col class="table-data-text">
                                {{ getRawValue(entry.frame_idx, entry.record_idx, entry.field_idx) }}
                            </v-col>
                            <v-col class="table-data-text">
                                {{ getNormalizedValue(entry.frame_idx, entry.record_idx, entry.field_idx) }}
                            </v-col>
                            <v-col class="table-data-text">
                                {{ getUpdatedValue(entry.value?.toString(), entry.field_idx) }}
                            </v-col>
                        </v-row>
                    </v-expansion-panel-text>
                </v-card>
            </v-expansion-panel>

        </v-expansion-panels>


        <v-dialog v-model="confirmDialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    Confirm {{ dialogMode === 'accept' ? 'Acceptance' : 'Rejection' }}
                </v-card-title>

                <v-card-text>
                    Are you sure you want to {{ dialogMode }} these modifications?
                    This action cannot be undone.
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="confirmDialog = false">Cancel</v-btn>
                    <v-btn :color="dialogMode === 'accept' ? 'primary' : 'error'" @click="handleConfirm">
                        {{ dialogMode === 'accept' ? 'Accept' : 'Reject' }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-col>


</template>

<script setup lang="ts">
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import { FrameRecordPair, RecordModel } from '@/types/api/records'
import { UpdateBatch } from '@/types/api/update'
import { onMounted, ref } from 'vue'
import "../styles/main.css"
import { useTrackedYearsStore } from '@/core/stores/trackedYears'
import { useTrackedFeaturesStore } from '@/core/stores/trackedFeatures'
import { acceptBatch, fetchUnacceptedBatches, fetchUpdateBatchById, rejectBatch } from '@/core/api/batch'
import { fetchMultiplePersonValues } from '@/core/api/api'
import { NO_INFORMATION } from '@/config/constants'

// Store instances
const errorMessageStore = useErrorMessagesStore()
const years = useTrackedYearsStore()
const trackedFeatures = useTrackedFeaturesStore()

// UI state variables
const fetching = ref(true)                          // Controls loading spinner
const confirmDialog = ref(false)                    // Controls confirm dialog visibility
const dialogMode = ref<'accept' | 'reject' | null>(null) // Tracks whether user is accepting or rejecting
const batchId = ref<number>(-1)                     // Stores currently selected batch ID

// Tracks expanded items in the UI panel
const expandedIndexes = ref<number[]>([])

// List of update batches and original values
const updateBatches = ref<UpdateBatch[]>([])
const originalValues = ref<Map<number, Map<number, RecordModel>>>(new Map())


/**
 * Retrieves a readable version of the proposed new value,
 * handling multi-string features as needed.
 */
function getUpdatedValue(value: string, field_idx: number) {
    const prettyFeature = trackedFeatures.getTrackedFeature(field_idx, true)
    if (!prettyFeature || !value) return NO_INFORMATION

    if (trackedFeatures.isFeatureMultiString(prettyFeature, true)) {
        return value.split(trackedFeatures.getMultistringsSeparator).sort().join(", ")
    }
    return value
}

function formatTimestamp(timestamp: string): string {
    // Fix fractional seconds to 3 digits for compatibility
    const normalizedTimestamp = timestamp.replace(/(\.\d{3})\d+/, '$1');
    const date = new Date(normalizedTimestamp);

    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    return date.toLocaleString('en-EN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
}


/**
 * Returns the original raw value for the given indices.
 */
function getRawValue(frame_idx: number, record_idx: number, field_idx: number): string {
    return getRawOrNormalizedValue(frame_idx, record_idx, field_idx, false)
}

/**
 * Returns the original normalized value for the given indices.
 */
function getNormalizedValue(frame_idx: number, record_idx: number, field_idx: number): string {
    return getRawOrNormalizedValue(frame_idx, record_idx, field_idx, true)
}

/**
 * Helper to retrieve either raw or normalized value depending on the flag.
 */
function getRawOrNormalizedValue(frame_idx: number, record_idx: number, field_idx: number, normalized: boolean): string {
    const prettyFeature = trackedFeatures.getTrackedFeature(field_idx, true)
    if (!prettyFeature) return NO_INFORMATION

    const entry = originalValues.value.get(frame_idx)?.get(record_idx)
    if (!entry) return NO_INFORMATION

    let value = entry.raw_values[field_idx]
    if (normalized) {
        value = entry.normalized_values[field_idx]
    }

    if (!value) {
        return NO_INFORMATION
    }

    if (trackedFeatures.isFeatureMultiString(prettyFeature, true)) {
        return value.split(trackedFeatures.getMultistringsSeparator)
            .filter(v => v)
            .sort()
            .join(", ")
    }
    return value

}

/**
 * Opens confirmation dialog for accepting or rejecting a batch.
 */
function openConfirmDialog(mode: 'accept' | 'reject', id: number) {
    dialogMode.value = mode
    batchId.value = id
    confirmDialog.value = true
}

/**
 * Handles the actual batch acceptance or rejection after confirmation.
 */
async function handleConfirm() {
    confirmDialog.value = false
    try {
        if (dialogMode.value === 'accept' && batchId.value !== -1) {
            // Accept logic here
            await acceptBatch(batchId.value)
            errorMessageStore.addInfoMessage("Modifications accepted")
        } else if (dialogMode.value === 'reject' && batchId.value !== -1) {
            // Reject logic here
            await rejectBatch(batchId.value)
            errorMessageStore.addInfoMessage("Modifications rejected")

        } else {
            errorMessageStore.addErrorMessage(`Batch id unkown`)
        }
        // Remove the processed batch from list
        updateBatches.value = updateBatches.value.filter(batch => batch.id !== batchId.value)
        expandedIndexes.value = []
        batchId.value = -1
        dialogMode.value = null

    } catch (error) {
        errorMessageStore.handleError(error)
    }

}


/**
 * Fetches all unaccepted batches and their corresponding original values.
 */
async function fetchBatches() {
    const unacceptedBatches = await fetchUnacceptedBatches()
    // Retrieve batch details
    const updateBatchesTemp = await Promise.all(unacceptedBatches.map(id => fetchUpdateBatchById(id)))

    // Collect all frame-record pairs from batches
    const entries: FrameRecordPair[] = updateBatchesTemp.flatMap((batch) => batch.entries).map((e) => {
        return { frame_idx: e.frame_idx, record_idx: e.record_idx } as FrameRecordPair
    })

    // Fetch original raw and normalized values for entries
    const response = await fetchMultiplePersonValues(entries)
    const originalValuesTemp: Map<number, Map<number, RecordModel>> = new Map()
    response.results.forEach((r) => {

        let record_idx_values = originalValuesTemp.get(r.frame_idx)
        if (!record_idx_values) {
            originalValuesTemp.set(r.frame_idx, new Map())
        }
        record_idx_values = originalValuesTemp.get(r.frame_idx)

        let v: RecordModel | undefined = undefined
        if (r.values) {
            v = { raw_values: r.values.raw_values, normalized_values: r.values.normalized_values }
        }

        record_idx_values.set(r.record_idx, v)
    })

    originalValues.value = originalValuesTemp
    updateBatches.value = updateBatchesTemp
}

/**
 * Initial lifecycle hook: load years, features, and pending updates.
 */
onMounted(async () => {
    fetching.value = true
    try {
        await years.fetchAndStoreTrackedYears()
        await trackedFeatures.fetchAndStoreTrackedFeatures()
        await fetchBatches()
        fetching.value = false
    } catch (error) {
        errorMessageStore.handleError(error)
    }
})

</script>

<style scoped>
.loading-spinner {
    position: fixed;
    /* Ensures it stays in the middle of the viewport */
    top: 50%;
    left: 50%;
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

.expansion-bg {
    background-color: var(--background);
}
</style>
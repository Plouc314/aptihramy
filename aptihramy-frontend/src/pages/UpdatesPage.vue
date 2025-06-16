<template>
    <TopBar title="Pending updates" :go-back-btn="true"></TopBar>
    <v-col>
        <v-progress-circular v-if="fetching" indeterminate :size="80" :width="10"
            class="loading-spinner"></v-progress-circular>

        <v-card v-else-if="updateBatches.length === 0">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span class="error-text">No pending updates</span>
            </v-card-text>
        </v-card>
        <v-expansion-panels v-model="expandedIndexes" multiple v-else>
            <v-expansion-panel v-for="(batch, batchIdx) in updateBatches" :key="batchIdx">
                <v-expansion-panel-title>
                    <v-row align="center">
                        <v-col cols="4" class="text-subtitle-1 font-weight-medium">
                            Author: {{ batch.author }}
                        </v-col>

                        <v-spacer></v-spacer>

                        <v-col cols="auto">
                            <v-btn color="error" variant="tonal" class="me-2"
                                @click.stop="openConfirmDialog('reject', batch.id)">
                                Reject
                            </v-btn>
                            <v-btn color="success" variant="tonal" @click.stop="openConfirmDialog('accept', batch.id)">
                                Accept
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                    <v-row class="table-header-row">
                        <v-col
                            v-for="(column, index) in ['Year', 'Index in file', 'Modified feature', 'Original Raw Value', 'Original Normalized Value', 'Proposed New Value']"
                            :key="index">
                            {{ column }}
                        </v-col>
                    </v-row>

                    <v-row v-for="(entry, index) of batch.entries" v-if="originalValues.size != 0" :key="index"
                        class="table-data-row">
                        <v-col>
                            {{ years.getYearFromFrameIdx(entry.frame_idx) }}
                        </v-col>
                        <v-col>
                            {{ entry.record_idx + 2 }}
                        </v-col>
                        <v-col>
                            {{ features.getTrackedFeature(entry.field_idx) }}
                        </v-col>
                        <v-col>
                            {{ originalValues.get(entry.frame_idx).get(entry.record_idx).raw_values[entry.field_idx] }}
                        </v-col>
                        <v-col>
                            {{
                                originalValues.get(entry.frame_idx).get(entry.record_idx).normalized_values[entry.field_idx]
                            }}
                        </v-col>
                        <v-col>
                            {{ entry.value }}
                        </v-col>

                    </v-row>
                </v-expansion-panel-text>
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
import { acceptBatch, fetchMultiplePersonValues, fetchUnacceptedBatches, fetchUpdateBatchById, rejectBatch } from '@/core/api'
import { useErrorMessagesStore } from '@/core/stores/errorMessages'
import { FrameRecordPair, RecordModel } from '@/types/api/records'
import { UpdateBatch } from '@/types/api/update'
import { onMounted, ref } from 'vue'
import "../styles/main.css"
import { useTrackedYearsStore } from '@/core/stores/trackedYears'
import { useTrackedFeaturesStore } from '@/core/stores/trackedFeatures'


const errorMessageStore = useErrorMessagesStore()
const years = useTrackedYearsStore()
const features = useTrackedFeaturesStore()


const fetching = ref(true)

const confirmDialog = ref(false)
const dialogMode = ref<'accept' | 'reject' | null>(null)
const batchId = ref<number>(-1)

function openConfirmDialog(mode: 'accept' | 'reject', id: number) {
    dialogMode.value = mode
    batchId.value = id
    confirmDialog.value = true
}

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

        batchId.value = -1
        dialogMode.value = null
        fetching.value = true
        await fetchBatches()
        fetching.value = false
    } catch (error) {
        errorMessageStore.handleError(error)
    }

}

const expandedIndexes = ref<number[]>([])
const updateBatches = ref<UpdateBatch[]>([])
const originalValues = ref<Map<number, Map<number, RecordModel>>>(new Map())


async function fetchBatches() {
    const unacceptedBatches = await fetchUnacceptedBatches()
    const updateBatchesTemp = await Promise.all(unacceptedBatches.map(id => fetchUpdateBatchById(id)))

    const entries: FrameRecordPair[] = updateBatchesTemp.flatMap((batch) => batch.entries).map((e) => {
        return { frame_idx: e.frame_idx, record_idx: e.record_idx } as FrameRecordPair
    })


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
    updateBatches.value = updateBatchesTemp.filter((b) => b.entries.length != 0)
}

onMounted(async () => {
    fetching.value = true
    try {
        await years.fetchAndStoreTrackedYears()
        await features.fetchAndStoreTrackedFeatures()
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
</style>
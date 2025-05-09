<template>
    <v-card class="card">
        <!-- Table header -->
        <v-col>
            <v-row class="table-header">
                <v-col cols="3" class="header-cell">Feature</v-col>
                <v-col cols="3" class="header-cell">Raw Value</v-col>
                <v-col cols="3" class="header-cell">Memory</v-col>
                <v-col cols="2" class="header-cell">Normalized Value</v-col>
                <v-col cols="1" align-start="end">

                    <v-btn class="error-btn" @click="$emit('close')">
                        <template v-slot:prepend>
                            <v-icon>mdi mdi-close</v-icon>
                        </template>
                        Close
                    </v-btn>
                </v-col>
            </v-row>

            <!-- Table body -->
            <div class="table-body">
                <v-row v-for="([feature, value], featureIndex) in frameInformation" :key="featureIndex"
                    class="table-row">
                    <v-col cols="3" class="cell feature-name">{{ feature }}</v-col>
                    <v-col cols="3" class="cell">{{ value.raw_value ?? '—' }}</v-col>
                    <v-col cols="3" class="cell">
                        <span v-if="value.memory && value.memory.length">
                            <span v-for="(mem, memIndex) in value.memory" :key="memIndex" class="memory-item">
                                <v-tooltip :text="getToolTipText(feature, value.distances)">
                                    <template v-slot:activator="{ props }">
                                        <v-chip v-bind="props" variant="flat" class="chip"
                                            :style="chipColor(value.distances[featureIndex])">
                                            {{ mem }}
                                        </v-chip>
                                    </template>
                                </v-tooltip>
                            </span>
                        </span>
                        <span v-else>—</span>
                    </v-col>
                    <v-col cols="3" class="cell">{{ value.normalized_value ?? '—' }}</v-col>
                </v-row>
            </div>
        </v-col>
    </v-card>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, StyleValue } from "vue";
import { CandidateRecordValues, OneFrameInformationProps } from '../types/types';
import '../styles/theme.css';
import '../styles/button.css';
import { fetchPersonValues } from '@/core/api';
import { useSnackbarQueue } from '@/core/snackbarQueue';
import { trackedFeaturesStore } from '../core/stores/trackedFeatures';
import { trackedYearsStore } from "@/core/stores/trackedYears";
import { getEdgeColor } from "@/core/utils";


const props = defineProps<OneFrameInformationProps>();

const { addSnackbar, snackbarTypes } = useSnackbarQueue();

function getToolTipText(pretty_feature: string, distances: number[]): string {
    const feature_index = tfStore.getTrackedFeatureIndex(pretty_feature, true)
    return distances[feature_index] == null ? "No information" : `Distance to raw calue: ${distances[feature_index].toFixed(3)}`
}

function chipColor(score: number): StyleValue {
    return {
        "background-color": getEdgeColor(score),
    }
}

const error = ref(false)
const tfStore = trackedFeaturesStore()
const tyStore = trackedYearsStore()

function showPage() {
    console.log("TO BE IMPLEMENTED")
}


const frameInformation = computed(() => {
    const all_feature_values = new Map<string, CandidateRecordValues>()
    const trackedFeatures = tfStore.getTrackedFeatures.pretty_features


    for (let i = 0; i < trackedFeatures.length; i++) {
        const diag = props.recordValuesDiagnostic


        const mem = props.memory == null ? null : props.memory[i]
        const test = diag.record_diagnostics == null ? null : diag.record_diagnostics.record_score
        const r_distances = diag.record_diagnostics == null ? null : diag.record_diagnostics.distances
        const values: CandidateRecordValues = {
            raw_value: diag.record_raw_values[i],
            normalized_value: diag.record_normalized_values[i],
            memory: mem,
            distances: r_distances,
            score: test
        }

        const feature = trackedFeatures[i]
        all_feature_values.set(feature, values)
    }


    all_feature_values.set("Annee", { raw_value: tyStore.getYearFromFrameIdx(props.frameIdx), normalized_value: null, memory: null, distances: null, score: null })
    all_feature_values.set("Index dans le fichier", { raw_value: props.recordIdx + 2, normalized_value: null, memory: null, distances: null, score: null })
    return all_feature_values

})

tfStore.fetchTrackedFeatures()
tyStore.fetchTrackedYears()

</script>


<style scoped>
.card {
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    background-color: var(--background);
    color: var(--text-primary);
    box-shadow: 0px 4px 10px var(--box-shadow);
}


.chip {
    color: var(--text-primary);
    font-weight: 450;
}

.table-body {
    margin-top: 15px;
    max-height: 35vh;
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 5px;
}


.table-row {
    border-bottom: 1px solid var(--box-shadow);
}

.cell {
    font-size: 14px;
    color: var(--text-primary);
}

.feature-name {
    font-weight: bold;
}

.memory-cell {
    display: flex;
    flex-direction: column;
}

.memory-item {
    cursor: pointer;
    /* Indicates that the memory item is clickable */
    padding: 2px 0;
}

.memory-item:hover {
    background-color: var(--highlight-color, #f0f0f0);
    /* Highlight background on hover */
    color: var(--primary, #007bff);
    /* Change text color on hover */
    transition: background-color 0.3s ease, color 0.3s ease;
    /* Smooth transition for color change */
}

.header-cell {
    font-size: 16px;
    font-weight: bold;
    color: var(--primary);
    text-transform: uppercase;
}

.table-header {
    font-weight: bold;
    background-color: var(--background-secondary);
    color: var(--text-secondary);
    border-bottom: 2px solid var(--primary);
    text-transform: uppercase;
    padding: 4px 0;
}
</style>
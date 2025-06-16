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
                    <v-col cols="3" class="cell">{{ displayFeatureValue(feature, value.raw_value) }}</v-col>
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
                    <v-col cols="3" class="cell">{{ displayFeatureValue(feature, value.normalized_value) }}</v-col>
                </v-row>
            </div>
        </v-col>
    </v-card>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, StyleValue } from "vue";
import '../styles/main.css';
import { fetchPersonValues } from '@/core/api';
import { getEdgeColor } from "@/core/utils";
import { useTrackedYearsStore } from "@/core/stores/trackedYears";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import { CandidateRecordValues, OneFrameInformationProps } from "../types";


const props = defineProps<OneFrameInformationProps>();
const trackedFeatureStore = useTrackedFeaturesStore()
const trackedYearsStore = useTrackedYearsStore()

/**
 * Returns tooltip text for a memory chip showing the distance.
 * @param pretty_feature the (pretty) feature for which to retrieve the colour
 * @param distances distances between memory and raw values (in feature order)
 */
function getToolTipText(pretty_feature: string, distances: number[]): string {
    const feature_index = trackedFeatureStore.getTrackedFeatureIndex(pretty_feature, true)
    return distances[feature_index] == null ? "No information" : `Distance to raw value: ${distances[feature_index].toFixed(3)}`
}

/**
 * Returns style object with color determined by distance score.
 */
function chipColor(score: number): StyleValue {
    return {
        "background-color": getEdgeColor(score),
    }
}


function displayFeatureValue(feature: string, value: string | number | null): string {
    if (!value) {
        return '—'
    }

    if (!isNaN(Number(value))) {
        return value.toString()
    }

    const valueString = value as string

    if (trackedFeatureStore.isFeatureMultiString(feature)) {
        return valueString.split("|").filter(v => v != "").join(", ")
    }

    return valueString
}

function showPage() {
    console.log("TO BE IMPLEMENTED")
}

/**
 * Computes a map of feature name -> record values for this frame.
 * Also includes special entries like year and file index.
 */
const frameInformation = computed(() => {
    const all_feature_values = new Map<string, CandidateRecordValues>()
    const trackedFeatures = trackedFeatureStore.getTrackedFeatures.pretty_features


    for (let i = 0; i < trackedFeatures.length; i++) {
        const diag = props.recordValuesDiagnostic


        const mem = props.memory == null ? null : props.memory[i]
        const score = diag.record_diagnostics == null ? null : diag.record_diagnostics.record_score
        const distances = diag.record_diagnostics == null ? null : diag.record_diagnostics.distances
        const values: CandidateRecordValues = {
            raw_value: diag.record_raw_values[i],
            normalized_value: diag.record_normalized_values[i],
            memory: mem,
            distances: distances,
            score: score
        }

        const feature = trackedFeatures[i]
        all_feature_values.set(feature, values)
    }

    all_feature_values.set("Annee", {
        raw_value: trackedYearsStore.getYearFromFrameIdx(props.frameIdx),
        normalized_value: null,
        memory: null,
        distances: null,
        score: null,
    });

    all_feature_values.set("Index dans le fichier", {
        raw_value: props.recordIdx + 2, // +2 likely accounts for header row + 1-based indexing
        normalized_value: null,
        memory: null,
        distances: null,
        score: null,
    });

    return all_feature_values

})
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
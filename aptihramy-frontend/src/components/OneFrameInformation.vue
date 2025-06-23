<template>
    <v-card class="card">
        <!-- Table header -->
        <v-col>
            <v-row class="table-header">
                <v-col cols="2" class="header-cell">Feature</v-col>
                <v-col cols="2" class="header-cell">Raw Value</v-col>
                <v-col cols="3" class="header-cell">Memory</v-col>
                <v-col cols="2" class="header-cell">
                    Distance
                    <v-tooltip
                        text="Represents the similarity score between the memory and raw value">
                        <template v-slot:activator="{ props }">
                            <v-btn v-bind="props" icon="mdi-information-outline" variant="text">
                            </v-btn>
                        </template>
                    </v-tooltip>
                </v-col>
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
                    <v-col cols="2" class="cell feature-name">{{ feature }}</v-col>
                    <v-col cols="2" class="cell">{{ displayFeatureValue(feature, value.raw_value) }}</v-col>
                    <v-col cols="3" class="cell">
                        <span v-if="value.memory && value.memory.length">
                            <v-chip v-bind="props" variant="flat" class="chip" :style="chipColor(value.distance)"
                                v-for="(mem, memIndex) in value.memory" :key="memIndex">
                                {{ mem }}
                            </v-chip>
                        </span>
                        <span v-else>—</span>
                    </v-col>
                    <v-col cols="2">
                        {{ value.distance?.toFixed(3) }}
                    </v-col>
                    <v-col cols="2" class="cell">{{ displayFeatureValue(feature, value.normalized_value) }}</v-col>
                </v-row>
            </div>
        </v-col>
    </v-card>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, StyleValue } from "vue";
import '../styles/main.css';
import { getEdgeColor } from "@/core/utils";
import { useTrackedYearsStore } from "@/core/stores/trackedYears";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import { CandidateRecordValues, OneFrameInformationProps } from "../types";


const props = defineProps<OneFrameInformationProps>();
const trackedFeatureStore = useTrackedFeaturesStore()
const trackedYearsStore = useTrackedYearsStore()

/**
 * Returns style object with color determined by distance score.
 */
function chipColor(score: number): StyleValue {
    return {
        "background-color": getEdgeColor(score),
    }
}


/**
 * Formats a feature value for display.
 * Handles nulls, numbers, and multi-string features.
 */
function displayFeatureValue(feature: string, value: string | number | null): string {
    if (!value) {
        return '—'
    }

    if (!isNaN(Number(value))) {
        return value.toString()
    }

    const valueString = value as string

    // For multi-string fields (e.g. joined by '|'), split and format
    if (trackedFeatureStore.isFeatureMultiString(feature)) {
        return valueString.split(trackedFeatureStore.getMultistringsSeparator).filter(v => v).join(", ")
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
            raw_value: diag.record_raw_values?.[i],
            normalized_value: diag.record_normalized_values?.[i],
            memory: mem,
            distance: distances?.[i],
            score: score
        }

        const feature = trackedFeatures[i]
        all_feature_values.set(feature, values)
    }

    all_feature_values.set("Annee", {
        raw_value: trackedYearsStore.getYearFromFrameIdx(props.frameIdx),
        normalized_value: null,
        memory: null,
        distance: null,
        score: null,
    });

    all_feature_values.set("Index dans le fichier", {
        raw_value: props.recordIdx + 2, // +2 accounts for header row + 1-based indexing
        normalized_value: null,
        memory: null,
        distance: null,
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
    margin: 1px;
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
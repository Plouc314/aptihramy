<template>
    <v-card class="mb-6 pa-4 rounded-lg elevation-2">
        <v-row align="center">
            <v-col cols="4">
                <v-combobox v-model="valueToReplace" :items="allValuesToReplace" label="Value to replace" clearable
                    dense hide-details variant="outlined" class="replace-select"></v-combobox>
            </v-col>
            <v-col cols="1" class="text-center">
                <v-icon>mdi-arrow-right</v-icon>
            </v-col>
            <v-col cols="4">
                <v-combobox v-model="replacementValue" :items="allValues" label="Replace with" clearable dense
                    hide-details variant="outlined" class="replace-select"></v-combobox>
            </v-col>
            <v-col cols="3">
                <v-btn class="ok-btn" @click="replaceValue" block>Replace</v-btn>
            </v-col>
        </v-row>
    </v-card>

    <v-row class="table-header-row">
        <v-col v-for="header in ['Year', 'Raw value', 'Normalized value', 'Candidate values', 'Selected']" :key="header"
            :cols="header === 'Candidate Values' ? 3 : undefined">
            {{ header }}
        </v-col>
    </v-row>

    <v-row v-for="(frameIdx, idx) in frameIdxValues.keys()" :key="idx" class="table-data-row">
        <!-- Year -->
        <v-col>{{ trackedYearsStore.getYearFromFrameIdx(frameIdx) }}</v-col>

        <v-col>
            <v-chip class="chip" v-for="(rawValue, rawIdx) in getRawValue(frameIdx)" :key="rawIdx">{{ rawValue
                }}</v-chip>
        </v-col>

        <!-- Normalized value -->
        <v-col>
            <v-tooltip v-for="(normValue, normIdx) in getNormalizedValue(frameIdx)" :key="normIdx"
                :text="selectedFrameIdxValue[frameIdx]?.includes(normValue) ? 'Normalized and selected values match' : 'Normalized and selected values differ'">
                <template v-slot:activator="{ props }">
                    <v-chip v-bind="props"
                        :style="{ backgroundColor: getColorForMatch(selectedFrameIdxValue[frameIdx]?.includes(normValue)) }"
                        class="chip">
                        {{ normValue }}
                    </v-chip>
                </template>
            </v-tooltip>
        </v-col>

        <!-- Candidate values -->
        <v-col>
            <v-chip v-if="candidateValues(frameIdx).length !== 0" v-for="candidateValue in candidateValues(frameIdx)"
                :key="candidateValue" class="chip">
                {{ candidateValue }}
            </v-chip>
            <v-chip v-else>
                {{ NO_INFORMATION }}
            </v-chip>
        </v-col>

        <!-- Selected value -->
        <v-col>
            <div v-if="isFeatureMultiString">
                <v-combobox v-model="selectedFrameIdxValue[frameIdx]" :items="allValues" label="Select value" multiple
                    @update:model-value="val => selectedFrameIdxValue[frameIdx] = !val || val.includes('Empty') ? [] : val"
                    clearable dense x-large :class="{ 'animate-pulse': animatedFrameIdxs.has(frameIdx) }"
                    variant="outlined" />
            </div>
            <div v-else>
                <v-combobox :model-value="selectedFrameIdxValue[frameIdx][0] ?? null"
                    @update:model-value="val => selectedFrameIdxValue[frameIdx] = val ? [val == 'Empty' ? '' : val] : []"
                    :items="allValues" label="Select value"
                    :class="{ 'animate-pulse': animatedFrameIdxs.has(frameIdx) }" variant="outlined" />
            </div>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { getColorForMatch } from "@/core/utils";
import "../styles/main.css";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import { useTrackedYearsStore } from "@/core/stores/trackedYears";
import { EditMetricsEmit, EditMetricsProps, FeatureMatchForYear } from "../types";
import { NO_INFORMATION } from "@/config/constants";

const trackedYearsStore = useTrackedYearsStore()
const trackedFeatures = useTrackedFeaturesStore()
const props = defineProps<EditMetricsProps>();
const emit = defineEmits<EditMetricsEmit>();
defineExpose({ resetToDefault });

// State for storing frame index values and their associated feature matches
const frameIdxValues = ref<Map<number, FeatureMatchForYear>>(new Map());
// Reactive object for storing currently selected values for each frame index. 
// At the beginning the values are normalized values
const selectedFrameIdxValue = reactive<Record<number, null | string[]>>({});

// Map for storing original normalized values for each frame index
const originalFrameIdxValue = ref<Map<number, null | string[]>>(new Map());

// Set for tracking frame indices with active animations
const animatedFrameIdxs = ref(new Set<number>());
// List of all available values for selection
const allValues = ref<string[]>([]);
// Value to be replaced in the replace functionality
const valueToReplace = ref<string | null>(null);
// Replacement value for the replace functionality
const replacementValue = ref<string | null>(null);

// Computed property for the combobox, including an "All" and "Empty" option
const allValuesToReplace = computed(() => ["All", ...allValues.value]);

const isFeatureMultiString = ref(true)
const separator = ref<string>("|")

// Splits the given string with the separator and removes null, undefined and empty strings
function splitFilter(a: string): string[] {
    return a.split(separator.value).filter(s => s)
}

// Get all candidate values (raw + normalized), deduplicated
// Candidate values include also the values of the candidate records (matching record + the others)
function candidateValues(frameIdx: number): string[] {
    const candidates = frameIdxValues.value.get(frameIdx)?.candidates || [];
    let candidatesFlat = candidates
        .flatMap(v => [v.rawValue, v.normalizedValue])
        .filter(v => v !== null && v !== "")
        .map(v => v.toString())

    if (isFeatureMultiString.value) {
        candidatesFlat = candidatesFlat.flatMap(v => splitFilter(v))
    }

    return Array.from(new Set(candidatesFlat))
};

// Get normalized values for a given frame index
function getNormalizedValue(frameIdx: number): string[] {
    return getRawOrNormalizedValue(frameIdx, true)
};

// Get the raw value for a frame index
function getRawValue(frameIdx: number): string[] {
    return getRawOrNormalizedValue(frameIdx, false)
}
// Helper function to retrieve raw or normalized values for a frame index
function getRawOrNormalizedValue(frameIdx: number, normalized: boolean): string[] {
    const matchCandidates = frameIdxValues.value.get(frameIdx)
    if (matchCandidates) {
        const candidates = matchCandidates.candidates
        const index = candidates.findIndex(c => c.recordIdx == matchCandidates.matchingRecordIndex)
        if (index < 0) {
            return [NO_INFORMATION]
        }

        const ret = normalized ? candidates[index].normalizedValue : candidates[index].rawValue

        if (ret) {
            const s = ret.toString()
            if (isFeatureMultiString.value) {
                return splitFilter(s)
            }
            return [s]
        }
    }
    return [NO_INFORMATION]
}

// Perform value replacement based on user selection
function replaceValue() {
    if (!valueToReplace.value || !replacementValue.value) return;

    animatedFrameIdxs.value.clear();
    let target = Object.keys(selectedFrameIdxValue)

    console.log(selectedFrameIdxValue)

    if (valueToReplace.value === "Empty") {
        target = target.filter(year => selectedFrameIdxValue[year]?.length == 0)
    } else if (valueToReplace.value !== "All") {
        target = target.filter(year => selectedFrameIdxValue[year].includes(valueToReplace.value))
    }

    target.forEach(year => {
        animatedFrameIdxs.value.add(Number(year));
        selectedFrameIdxValue[year] = [replacementValue.value === "Empty" ? "" : replacementValue.value!];
    });

    console.log(selectedFrameIdxValue)
    setTimeout(() => animatedFrameIdxs.value.clear(), 1500);
};

// Reset selections to the original normalized values
function resetToDefault() {
    Object.keys(selectedFrameIdxValue).forEach(frameIdx => {
        selectedFrameIdxValue[frameIdx] = originalFrameIdxValue.value.get(Number(frameIdx));
    });
};


function arraysEquals(a: string[], b: string[]) {
    const aSorted = [...a].sort()
    const bSorted = [...b].sort()

    return a.length == b.length && aSorted.every((val, index) => val === bSorted[index])
}

// Compute differences between current and original selected values
function getOriginalSelectedDifference(): Map<number, string[]> {
    const result = new Map<number, string[]>()
    Object.entries(selectedFrameIdxValue).forEach(([frameIdx, values]) => {
        if (!values) return

        const originalValues = originalFrameIdxValue.value.get(Number(frameIdx))
        if (!originalValues || !arraysEquals(values, originalValues)) {
            result.set(Number(frameIdx), values)
        }
    })
    return result
}


// Watcher: auto-save on change
// Save current (updated) values and emit to parent
watch(selectedFrameIdxValue, _ => {
    const update = new Map<number, string>()
    getOriginalSelectedDifference().forEach((values, featureIdx) => update.set(featureIdx, values.join(separator.value)))
    console.log(update)
    emit("update-values", props.prettyFeature, update);
})

onMounted(() => {
    frameIdxValues.value = props.frameIdxValues ?? new Map();
    isFeatureMultiString.value = trackedFeatures.isFeatureMultiString(props.prettyFeature, true)
    separator.value = trackedFeatures.getMultistringsSeparator

    const featureValues = new Set<string>();
    featureValues.add("Empty")

    // Initialize value maps
    frameIdxValues.value.forEach((values, year) => {
        values.candidates.forEach(v => {

            const rawString = v.rawValue ? v.rawValue.toString() : ""
            const normString = v.normalizedValue ? v.normalizedValue.toString() : ""

            if (isFeatureMultiString.value) {
                rawString?.split(separator.value).forEach(v => featureValues.add(v))
                normString?.split(separator.value).forEach(v => featureValues.add(v))

            } else {
                if (rawString) featureValues.add(rawString)
                if (normString) featureValues.add(normString)
            }

            // Init selected and original values using matching record index
            // Take the values from the candidate in the tracking chain (the matching record)
            if (!selectedFrameIdxValue[year] && v.recordIdx == values.matchingRecordIndex) {
                const updated = props.updatedValues?.get(year)
                // If updated value exist for this year use the updated value
                const selectedValue = updated ? updated.toString() : normString

                if (isFeatureMultiString.value) {
                    selectedFrameIdxValue[year] = splitFilter(selectedValue)
                    originalFrameIdxValue.value.set(year, splitFilter(normString));

                } else {
                    selectedFrameIdxValue[year] = [selectedValue]
                    originalFrameIdxValue.value.set(year, [normString]);

                }

            }
        });
    });
    console.log("original")
    console.log(originalFrameIdxValue.value)
    allValues.value = Array.from(featureValues).filter(v => v)

});
</script>

<style scoped>
.chip {
    font-size: 1rem;
    font-weight: 400;
    border-radius: 16px;
    margin: 1px;

}

.animate-pulse {
    animation: pulse 1.5s ease-out;
}

.replace-select {
    background-color: var(--background);
    margin: 15px;
    flex: 1;
}

@keyframes pulse {
    0% {
        background-color: var(--light-blue);
    }

    100% {
        background-color: transparent;
    }
}
</style>
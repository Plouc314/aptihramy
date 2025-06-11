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
        <v-col v-for="header in ['Year', 'Raw Value', 'Candidate Values', 'Normalized', 'Selected']" :key="header"
            :cols="header === 'Candidate Values' ? 3 : undefined">
            {{ header }}
        </v-col>
    </v-row>

    <v-row v-for="[frameIdx, values] in frameIdxValues" :key="frameIdx" class="table-data-row">
        <v-col>{{ trackedYearsStore.getYearFromFrameIdx(frameIdx) }}</v-col>
        <v-col>
            <v-chip>{{ originalFrameIdxValue[frameIdx] }}</v-chip>
        </v-col>
        <v-col cols="3">
            <v-chip-group column>
                <v-chip v-for="value in candidateValues(frameIdx)" :key="value">
                    {{ value }}
                </v-chip>
            </v-chip-group>
        </v-col>
        <v-col>
            <v-tooltip
                :text="normalizedValue(frameIdx) === selectedFrameIdxValue[frameIdx] ? 'Normalized and selected values match' : 'Normalized and selected values differ'">
                <template v-slot:activator="{ props }">
                    <v-chip v-bind="props"
                        :style="{ backgroundColor: getColorForMatch(normalizedValue(frameIdx) === selectedFrameIdxValue[frameIdx]) }"
                        class="chip">
                        {{ normalizedValue(frameIdx) }}
                    </v-chip>
                </template>
            </v-tooltip>
        </v-col>
        <v-col>
            <v-combobox v-model="selectedFrameIdxValue[frameIdx]" :items="allValues" label="Select value" clearable
                dense x-large :class="{ 'animate-pulse': animatedFrameIdxs.has(frameIdx) }" variant="outlined"></v-combobox>
        </v-col>
    </v-row>

    <v-row class="mt-4" justify="space-between">
        <v-col cols="3">
            <v-btn class="error-btn" variant="tonal" @click="resetValues" block>Reset to default values
                (normalized)</v-btn>
        </v-col>
        <v-col cols="2">
            <v-btn class="ok-btn" variant="tonal" @click="save" block>Save</v-btn>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { getColorForMatch } from "@/core/utils";
import { EditMetricsProps, EditMetricsEmit, IdxRawNormalizedValue, FeatureMatchForYear } from "../types/types";
import { useErrorMessagesStore } from "@/core/stores/errorMessages";
import "../styles/main.css";
import { useTrackedFeaturesStore } from "@/core/stores/trackedFeatures";
import { useTrackedYearsStore } from "@/core/stores/trackedYears";

const errorMessageStore = useErrorMessagesStore();
const trackedYearsStore = useTrackedYearsStore()

const props = defineProps<EditMetricsProps>();
const emit = defineEmits<EditMetricsEmit>();

const frameIdxValues = ref<Map<number, FeatureMatchForYear>>(new Map());
// frame idx -> value
const selectedFrameIdxValue = reactive<Record<number, string | number>>({});
const originalFrameIdxValue = reactive<Record<number, string | number>>({});
const animatedFrameIdxs = ref(new Set<number>());
const allValues = ref<(string | number)[]>([]);
const valueToReplace = ref<string | number | null>(null);
const replacementValue = ref<string | number | null>(null);

const allValuesToReplace = computed(() => ["All", ...allValues.value]);

function candidateValues(frameIdx: number) {
    const candidates = frameIdxValues.value.get(frameIdx)?.candidates || [];
    const a = candidates.flatMap(v => [v.rawValue, v.normalizedValue])
    return Array.from(new Set(a)).filter(v => v !== "")
};

function normalizedValue(frameIdx: number) {
    const matchCandidates = frameIdxValues.value.get(frameIdx)
    if (matchCandidates) {
        const candidates = matchCandidates.candidates
        const index = candidates.findIndex(c => c.recordIdx == matchCandidates.matchingRecordIndex)
        if (index < 0) {
            return "No infomation"
        }
        return candidates[index].normalizedValue

    }
    return "No information"
};

function replaceValue() {
    if (!valueToReplace.value || !replacementValue.value) return;

    animatedFrameIdxs.value.clear();
    const target = valueToReplace.value === "All" ? Object.keys(selectedFrameIdxValue) : Object.keys(selectedFrameIdxValue).filter(year => selectedFrameIdxValue[year] === valueToReplace.value);

    target.forEach(year => {
        animatedFrameIdxs.value.add(Number(year));
        selectedFrameIdxValue[year] = replacementValue.value!;
    });

    setTimeout(() => animatedFrameIdxs.value.clear(), 1500);
};

function resetValues() {
    Object.keys(selectedFrameIdxValue).forEach(frameIdx => {
        selectedFrameIdxValue[frameIdx] = originalFrameIdxValue[frameIdx];
    });
};

function save() {
    const updated = Object.entries(selectedFrameIdxValue).map(([frameIdx, value]) => {
        const recordIdx = frameIdxValues.value.get(Number(frameIdx)).matchingRecordIndex
        return { frameIdx: Number(frameIdx), recordIdx: recordIdx, value: value }
    });
    errorMessageStore.addInfoMessage(`${props.prettyFeature} saved`);
    emit("update-values", props.prettyFeature, updated);
};

onMounted(() => {
    frameIdxValues.value = props.frameIdxValues ?? new Map();
    const featureValues = new Set<string | number>();
    frameIdxValues.value.forEach((values, year) => {
        values.candidates.forEach(v => {
            featureValues.add(v.rawValue).add(v.normalizedValue);
            // Take value of the matching record
            if (!selectedFrameIdxValue[year] && v.recordIdx == values.matchingRecordIndex) {
                const updated = props.updatedValues?.get(year)
                selectedFrameIdxValue[year] = updated ? updated : v.normalizedValue;
                originalFrameIdxValue[year] = v.normalizedValue;
            }
        });
    });
    allValues.value = Array.from(featureValues);
});
</script>

<style scoped>
.table-header-row {
    font-weight: 600;
    color: var(--primary);
}

.chip {
    font-size: 1rem;
    font-weight: 500;
    border-radius: 16px;
    padding: 0 8px;
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
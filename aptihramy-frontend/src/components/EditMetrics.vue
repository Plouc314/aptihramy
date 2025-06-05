<template>
    <v-card class="mb-6 pa-4 elevation-2 rounded-lg">
        <v-row align="center" class="align-center">
            <v-col cols="4">
                <v-combobox v-model="valueToReplace" :items="allValuesToReplace" label="Value to replace" clearable
                    dense></v-combobox>
            </v-col>

            <v-col cols="1" class="text-center">
                <v-icon>mdi-arrow-right</v-icon>
            </v-col>

            <v-col cols="4">
                <v-combobox v-model="replacementValue" :items="allValues" label="Replace with" clearable
                    dense></v-combobox>
            </v-col>

            <v-col cols="3">
                <v-btn class="ok-btn" @click="replaceValue" block>Replace</v-btn>
            </v-col>
        </v-row>
    </v-card>

    <v-row class="table-header-row">
        <v-col class="table-header-col">Year</v-col>
        <v-col class="table-header-col">Raw Value</v-col>
        <v-col class="table-header-col" cols="3">Candidate Values</v-col>
        <v-col class="table-header-col">Normalized</v-col>
        <v-col class="table-header-col">Selected</v-col>
    </v-row>


    <v-row v-for="([year, values], yearIndex) in yearValues" :key="yearIndex" v-if="yearValues" class="table-data-row">
        <v-col>
            {{ year }}
        </v-col>

        <v-col>
            <v-chip class="ma-1">
                {{ originalYearModel[year] }}
            </v-chip>
        </v-col>
        <v-col cols="3">
            <v-chip-group column>
                <v-chip v-for="(value, index) in yearCandidateValues.get(year)" :key="index" class="ma-1">
                    {{ value }}
                </v-chip>
            </v-chip-group>
        </v-col>
        <v-col>
            <v-tooltip :text="getToolTipText(getNormalizedValue(year) == selectedValues[year])">
                <template v-slot:activator="{ props }">
                    <v-chip v-bind="props" :style="chipColor(getNormalizedValue(year) == selectedValues[year])"
                        variant="flat" class="chip">
                        {{ getNormalizedValue(year) }}
                    </v-chip>
                </template>
            </v-tooltip>
        </v-col>

        <v-col>
            <v-combobox v-model="selectedValues[year]" :items="allValues" label="Select value" clearable dense
                :class="{ 'animate-pulse': animatedYears.has(year) }"></v-combobox>

        </v-col>

    </v-row>


    <v-row class="mt-4" justify="space-between">
        <v-col cols="2">
            <v-btn class="error-btn" variant="tonal" @click="resetValues" block>
                Reset to default values
            </v-btn>
        </v-col>

        <v-col cols="2">
            <v-btn class="ok-btn" variant="tonal" @click="save" block>
                Save
            </v-btn>
        </v-col>
    </v-row>



</template>

<script setup lang="ts">
import { ref, computed, reactive, StyleValue, onMounted } from "vue";
import { getColorForMatch } from "@/core/utils";
import { EditMetricsProps, EditMetricsEmit, RawNormalizedValue } from "../types/types";
import '../styles/main.css';
import { useErrorMessagesStore } from "@/core/stores/errorMessages";

const errorMessageStore = useErrorMessagesStore()


const isReplaceClicked = ref(false)
const props = defineProps<EditMetricsProps>();
const emit = defineEmits<EditMetricsEmit>()

const selectedValues = reactive<Record<number, string | number>>({})
const originalYearModel = {}
const animatedYears = ref<Set<number>>(new Set())

const valueToReplace = ref(null)
const replacementValue = ref(null)

function getNormalizedValue(year: number): string {
    if (!yearValues.value) {
        return "No information"
    }
    const rawNormalizedValues = yearValues.value.get(year)
    if (rawNormalizedValues.length == 0) {
        return "No information"
    }

    return rawNormalizedValues[0].normalizedValue.toString()
}

function resetValues() {
    yearValues.value.forEach((value, year) => {
        selectedValues[year] = originalYearModel[year]
    })
}

function chipColor(matched: boolean): StyleValue {
    return {
        "background-color": getColorForMatch(matched),
    }
}

function getToolTipText(matched: boolean): string {
    return matched ? "The raw and normalized match" : "The raw and normalized do not match"
}

function replaceValue() {
    if (valueToReplace.value == null || replacementValue.value == null) {
        return
    }
    animatedYears.value.clear()
    isReplaceClicked.value = true

    setTimeout(() => isReplaceClicked.value = false, 1500)

    if (valueToReplace.value == "All") {
        yearValues.value.forEach((_, year) => {
            animatedYears.value.add(year)
            selectedValues[year] = replacementValue.value
        })
    } else {
        yearValues.value.forEach((value, year) => {
            if (selectedValues[year] == valueToReplace.value) {
                animatedYears.value.add(year)
                selectedValues[year] = replacementValue.value
            }
        })
    }

    setTimeout(() => {
        isReplaceClicked.value = false
        animatedYears.value.clear()
    }, 1500)
}

function save() {
    const m = new Map()
    Object.entries(selectedValues).forEach(([year, updatedValue]) => m.set(year, updatedValue))
errorMessageStore.addInfoMessage(`Feature: ${props.prettyFeature} saved`)
    emit("update-values", props.prettyFeature, m)
}

const yearValues = ref<Map<number, RawNormalizedValue[]> | null>(null)
const allValues = ref<(number | string)[]>([])


const yearCandidateValues = computed(() => {
    if (!yearValues.value) {
        return new Map<number, (number | string)[]>()
    }

    const m = new Map<number, (number | string)[]>()
    yearValues.value.forEach((values, year) => {
        const raw = values.map(v => v.rawValue)
        const normalized = values.map(v => v.normalizedValue)
        const rawNorm = new Set(raw.concat(normalized))
        m.set(year, Array.from(rawNorm))
    })
    return m
})

const allValuesToReplace = computed(() => {
    const a: (number | string)[] = ["All"]
    return a.concat(allValues.value)
})

// Aggregate all values
function setDefaultValues() {
    if (!yearValues.value) {
        return []
    }

    const featureValues = new Set<string | number>()
    yearValues.value.forEach((values, year) => {
        // Add all values (raw and normalized)
        values.forEach(rawNorm => featureValues.add(rawNorm.rawValue).add(rawNorm.normalizedValue))

        if (!selectedValues[year]) {
            let value = values[0].rawValue
            if (props.updatedValues) {
                // props.selectedValues.get(year) returns undefined. So manually get the value
                props.updatedValues.forEach((v, key) => {
                    if (key == year) {
                        value = v
                        return
                    }
                })


            }

            selectedValues[year] = value
            originalYearModel[year] = values[0].rawValue
        }

    })

    allValues.value = Array.from(featureValues)
}

onMounted(() => {
    yearValues.value = props.yearValues
    setDefaultValues()

})


</script>

<style scoped>
.table-header-col {
    font-weight: 600;
    color: var(--primary);
    /* Vuetify primary default */
}

.animate-pulse {
    animation: pulse 1.5s ease-out;
}

@keyframes pulse {
    0% {
        background-color: var(--light-blue);
    }

    100% {
        background-color: transparent;
    }
}


.chip {
    font-size: 1rem;
    font-weight: 500;
    border-radius: 16px;
    padding: 0 8px;
}
</style>
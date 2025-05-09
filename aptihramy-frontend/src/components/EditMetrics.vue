<template>
    <v-row>
        <v-col>
            Year
        </v-col>
        <v-col>
            Raw Value
        </v-col>
        <v-col>
            Normalized value
        </v-col>
    </v-row>

    <v-row v-for="([year, values], yearIndex) in yearValues" :key="yearIndex" v-if="yearValues">
        <v-col>
            {{ year }}
        </v-col>
        <v-col>
            <v-autocomplete v-model="yearModels[year]" :items="allRawValues" label="Select filter" clearable
                class="filter-select" />
        </v-col>
        <v-col>
            {{ getNormalizedValue(year) }}
        </v-col>
    </v-row>

</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { COLUMN_RAW_TO_PRETTY, COLUMN_PRETTY_TO_RAW, COLUMNS_PRETTY } from '@/config/constants';
import { TEST_DATA, CLEANED } from "@/config/test_data";
import { getPanelColor } from "@/core/utils";
import { EditMetricsProps } from "../types/types";
import '../styles/theme.css';
import '../styles/table.css'
import '../styles/button.css';

const props = defineProps<EditMetricsProps>();


const yearModels = reactive<Record<number, string | number>>({})

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



const yearValues = computed(() => props.yearValues)
const allRawValues = computed(() => {
    if (!yearValues.value) {
        return []
    }

    const featureValues = new Set<string | number>()
    yearValues.value.forEach((values, year) => {
        values.forEach(rawNorm => featureValues.add(rawNorm.rawValue).add(rawNorm.normalizedValue))

        if (!yearModels[year]) {
            yearModels[year] = values[0].rawValue
        }

    })

    return Array.from(featureValues)
})


const selectedColumn = ref(null)
onMounted(() => {
    //yearValues.value = props.yearValues


})
</script>

<style scoped>
.v-row {
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e0e0e0;
}

.v-col {
    font-size: 0.95rem;
    padding: 0.25rem 0.5rem;
}

.v-autocomplete.filter-select {
    min-width: 180px;
}

.v-row:nth-child(even) {
    background-color: #fafafa;
}

.v-col:first-child {
    font-weight: 600;
    color: #333;
}

.v-chip {
    font-size: 0.8rem;
    border-radius: 16px;
    padding: 0 8px;
}

.v-label {
    color: #666;
}

.v-input {
    --v-theme-primary: #1976d2;
}
</style>

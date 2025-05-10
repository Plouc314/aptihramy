<template>
    <v-col>
        <v-card class="header-card">
            <v-row v-for="filter in filters" :key="filter.id" class="filter">
                <Filter :can-remove="filters.length != 1" :id="filter.id" :remaining-columns="remainingColumns"
                    :suggestions="getSuggestions(filter.column)" @delete-filter="removeFilter"
                    @edit-filter="editFilter">
                </Filter>
            </v-row>
            <v-row justify="space-between">
                <v-btn class="ok-btn" prepend-icon="mdi-plus" rounded="lg" @click="addFilter">Add
                    Filter</v-btn>
            </v-row>

        </v-card>
        <v-progress-circular v-if="querySent" indeterminate :size="80" :width="10"
            class="loading-spinner"></v-progress-circular>
        <display-people v-if="filterResponse.size != 0" :data="filterResponse" :is-loading="querySent"></display-people>

    </v-col>

</template>

<script setup lang="ts">
import DisplayPeople from '@/components/DisplayPeople.vue';
import { ref, computed, watch } from 'vue';
import Filter from '@/components/Filter.vue';
import { FilterState, TrackerIDMemory } from "../types/types"
import { FilterRequest, } from '@/types/api_types';
import '../styles/main.css';
import { fetchFilteredTrackers } from '@/core/api';
import { trackedFeaturesStore } from '../core/stores/trackedFeatures';
import { useSnackbarQueue } from '@/core/snackbarQueue';


const { addSnackbar, snackbarTypes } = useSnackbarQueue();
const tfStore = trackedFeaturesStore()
const trackedFeatures = computed(() => tfStore.getTrackedFeatures)

let id = 1;
const filters = ref<FilterState[]>([{ id: 1, column: "", rowInput: "" }])
const filterResponse = ref<TrackerIDMemory>(new Map())
const querySent = ref(false)
const featureValues = ref<Set<string>[]>([])

const remainingColumns = computed<string[]>(() => {
    if (!trackedFeatures.value) {
        return [] as string[]
    }

    const usedColumns: string[] = filters.value.map(value => value.column).filter(v => v !== "")
    const ret: string[] = []
    for (let i = 0; i < trackedFeatures.value.pretty_features.length; i++) {
        const prettyFeature = trackedFeatures.value.pretty_features[i]
        if (!usedColumns.includes(prettyFeature)) {
            ret.push(prettyFeature)
        }
    }
    return ret
})

function addFilter(): void {
    id += 1
    const f: FilterState = { id: id, column: "", rowInput: "" }
    filters.value.push(f)
}

function removeFilter(filter: FilterState): void {
    filters.value = filters.value.filter(value => value.id !== filter.id)
    search()
}

function getSuggestions(column: string): string[] {
    const index = tfStore.getTrackedFeatureIndex(column)
    if (index < 0 || featureValues.value.length == 0) {
        return []
    }
    return Array.from(featureValues.value[index])
}

function findIndexValue(id: number): [number, FilterState] {
    for (let i = 0; i < filters.value.length; i++) {
        let value = filters.value[i]
        if (value.id === id) {
            return [i, value]
        }
    }
    return [-1, { id: 0, column: "", rowInput: "" }]
}

function editFilter(value: FilterState): void {
    let [index, currentValue] = findIndexValue(value.id)
    if (index < 0) {
        filters.value.push(value)
    } else {
        currentValue.column = value.column
        currentValue.rowInput = value.rowInput
        filters.value[index] = currentValue
    }
    search()
}

watch(filterResponse, (newFilterResponse) => {
    const temp_featureValues = Array.from(
        { length: trackedFeatures.value.pretty_features.length },
        () => new Set<string>()
    );
    newFilterResponse.forEach((trackerMemory, _) => {
        trackerMemory.forEach((featureValues, index) => {
            if (temp_featureValues.length == trackerMemory.length) {
                featureValues.forEach(v => temp_featureValues[index].add(v))
            }
        })
    })
    featureValues.value = temp_featureValues

})


function search(): void {

    const featureSearchValue = new Map<string, string>();

    if (!filters.value.some(v => v.rowInput.length > 2) || querySent.value) {
        return
    }

    for (const filter of filters.value) {
        if (trackedFeatures.value.pretty_features.includes(filter.column)) {
            featureSearchValue.set(filter.column, filter.rowInput)
        }
    }

    const request: FilterRequest = { filters: Object.fromEntries(featureSearchValue) }
    querySent.value = true
    fetchFilteredTrackers(request)
        .then((response) => {
            const trackerIDMem: TrackerIDMemory = new Map()
            for (const a in response.data) {
                trackerIDMem.set(a, response.data[a])
            }
            filterResponse.value = trackerIDMem

        })
        .catch((err) => {
            addSnackbar(`An error occurred: ${err}`, snackbarTypes.ERROR)
        }).finally(() => {
            querySent.value = false
        })
}

</script>


<style scoped>
.header-card {
    padding: 30px;
    background-color: "background";
    border-radius: 10px;
    box-shadow: 0 2px 4px "box-shadow";
    margin-bottom: 20px;
}

.filter {
    display: flex;
    padding: 10px;
    gap: 16px;
}

.filter-select {
    flex: 1;
}

.filter-select .v-label {
    color: "text-secondary";
    font-weight: bold;
}

.filter-select .v-input__control {
    min-height: 40px;
}

.filter-select .v-select__selection {
    color: "text-primary";
}

.loading-spinner {
    position: fixed;
    /* Ensures it stays in the middle of the viewport */
    top: 50%;
    left: 50%;
}
</style>
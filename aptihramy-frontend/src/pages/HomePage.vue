<template>
    <v-col>
        <v-btn @click="fetchRoot"></v-btn>
        <v-card class="header-card">
            <v-row v-for="filter in filters" :key="filter.id" class="filter">
                <Filter :can-remove="filters.length != 1" :id="filter.id" :remaining-columns="remainingColumns"
                    @delete-filter="removeFilter" @edit-filters="editFilter">
                </Filter>
            </v-row>
            <v-row justify="space-between">
                <v-btn class="ok-btn" prepend-icon="mdi-plus" rounded="lg" @click="addFilter">Add
                    Filter</v-btn>
                <v-btn class="ok-btn" prepend-icon="mdi-magnify" rounded="lg" @click="search">Search</v-btn>
            </v-row>

        </v-card>

        <display-people :data="filterResponse" :is-loading="false"></display-people>
    </v-col>

</template>

<script setup lang="ts">
import { COLUMNS_PRETTY } from '@/config/constants';
import DisplayPeople from '@/components/DisplayPeople.vue';
import { fetchRoot } from '@/core/api';
import { ref, computed } from 'vue';
import Filter from '@/components/Filter.vue';
import { FilterState, TrackerIDMemory } from "../types/types"
import { FilterRequest, } from '@/types/api_types';
import '../styles/theme.css';
import '../styles/button.css';
import { fetchFilteredTrackers } from '@/core/api';
import { trackedFeaturesStore } from '../core/stores/trackedFeatures';


const tfStore = trackedFeaturesStore()
const tracked_features = computed(() => tfStore.getTrackedFeatures)

let id = 1;
const filters = ref<FilterState[]>([{ id: 1, column: "", rowInput: "" }])
const filterResponse = ref<TrackerIDMemory>(new Map())

const remainingColumns = computed<string[]>(() => {
    if (!tracked_features.value) {
        return [] as string[]
    }

    const usedColumns: string[] = filters.value.map(value => value.column).filter(v => v !== "")
    const ret: string[] = []
    for (let i = 0; i < tracked_features.value.pretty_features.length; i++) {
        const prettyFeature = tracked_features.value.pretty_features[i]
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
}


function search(): void {

    const featureSearchValue = new Map<string, string>();
    for (const filter of filters.value) {
        if (tracked_features.value.pretty_features.includes(filter.column)) {
            featureSearchValue.set(filter.column, filter.rowInput)

        }
    }

    const request: FilterRequest = { filters: Object.fromEntries(featureSearchValue) }
    fetchFilteredTrackers(request)
        .then((response) => {
            const trackerIDMem: TrackerIDMemory = new Map()
            for (const a in response.data) {
                trackerIDMem.set(a, response.data[a])
            }
            filterResponse.value = trackerIDMem
        })
        .catch((err) => {
            console.error(err);
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
</style>
<template>
    <TopBar title="Find a person" :goBackBtn="false"></TopBar>
    <v-col>
        <v-progress-circular v-if="!trackedFeatures || !trackedYears" indeterminate :size="80" :width="10"
            class="loading-spinner"></v-progress-circular>
        <v-card v-else class="header-card">
            <v-row v-for="filter in filters" :key="filter.id" class="filter">
                <Filter :can-remove="filters.length != 1" :id="filter.id" :remaining-features="remainingFeatures"
                    :suggestions="getSuggestions(filter.feature)" @delete-filter="removeFilter"
                    :feature="filter.feature" :value="filter.input" @edit-filter="editFilter">
                </Filter>
            </v-row>
            <v-row justify="space-between">
                <v-btn class="ok-btn" prepend-icon="mdi-plus" rounded="lg" @click="addFilter">Add
                    Filter</v-btn>
            </v-row>

        </v-card>
        <v-progress-circular v-if="querySent" indeterminate :size="80" :width="10"
            class="loading-spinner"></v-progress-circular>


        <display-people v-if="filterResponse.size != 0" :data="filterResponse" :is-loading="querySent"
            class="display-people"></display-people>
    </v-col>
</template>

<script setup lang="ts">
import DisplayPeople from '@/components/DisplayPeople.vue';
import TopBar from '@/components/TopBars/TopBar.vue';
import { ref, computed, watch, onMounted, handleError } from 'vue';
import Filter from '@/components/Filter.vue';
import { FilterRequest, } from '@/types/api/api';
import '../styles/main.css';
import { fetchAllUserInformation, fetchUpdateBatch, fetchCurrentUserInformation, fetchFilteredTrackers, fetchUnacceptedBatches } from '@/core/api';
import { useErrorMessagesStore } from '@/core/stores/errorMessages';
import { useTrackedFeaturesStore } from '@/core/stores/trackedFeatures';
import { useTrackedYearsStore } from '@/core/stores/trackedYears';
import { useFilterStore } from '@/core/stores/filterStore';
import { FilterState, TrackerIDMemory } from '@/types';


const errorMessageStore = useErrorMessagesStore()
const trackedFeatureStore = useTrackedFeaturesStore()
trackedFeatureStore.fetchAndStoreTrackedFeatures()
const trackedYearsStore = useTrackedYearsStore()
trackedYearsStore.fetchAndStoreTrackedYears()

const trackedFeatures = computed(() => trackedFeatureStore.getTrackedFeatures)
const trackedYears = computed(() => trackedYearsStore.trackedYears)

// feature -> list of values
const filterResponse = ref<TrackerIDMemory>(new Map())
const querySent = ref(false)
const suggestionsFeatureValues = ref<Set<string>[]>([])
const filterStore = useFilterStore()
const filters = filterStore.storedFilters

const remainingFeatures = computed<string[]>(() => {
    if (!trackedFeatures.value) {
        return [] as string[]
    }

    const usedColumns: string[] = filters.map(value => value.feature).filter(v => v !== "")
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
    filterStore.createEmptyFilter()
}

function removeFilter(filter: FilterState): void {
    filterStore.removeFilter(filter)
    search()
}

function getSuggestions(column: string): string[] {
    const index = trackedFeatureStore.getTrackedFeatureIndex(column)
    if (index < 0 || suggestionsFeatureValues.value.length == 0) {
        return []
    }
    return Array.from(suggestionsFeatureValues.value[index])
}

function editFilter(filter: FilterState): void {
    filterStore.editFilter(filter)
    search()
}

// filterResponse is updated whenever a request is made
// When getting a filter response create a set of all values for each feature for the suggestions

watch(filterResponse, (newFilterResponse) => {
    console.log(newFilterResponse)
    const tempsuggestionsFeatureValues = Array.from(
        { length: trackedFeatures.value.pretty_features.length },
        () => new Set<string>()
    );

    newFilterResponse.forEach((trackerMemory, _) => {
        trackerMemory.forEach((suggestionsFeatureValues, index) => {
            // Should always be the case as the number of features should always be the same
            if (tempsuggestionsFeatureValues.length == trackerMemory.length) {
                suggestionsFeatureValues.forEach(v => tempsuggestionsFeatureValues[index].add(v))
            }
        })
    })
    suggestionsFeatureValues.value = tempsuggestionsFeatureValues
})


function search(): void {

    const featureSearchValue = new Map<string, string>();
    if (filters && !filters.some(v => v.input && v.input.length > 2) || querySent.value) {
        return
    }

    console.log("Send search")
    for (const filter of filters) {
        if (trackedFeatures.value.pretty_features.includes(filter.feature)) {
            featureSearchValue.set(filter.feature, filter.input)
        }
    }

    const request: FilterRequest = { filters: Object.fromEntries(featureSearchValue) }
    querySent.value = true
    fetchFilteredTrackers(request)
        .then((response) => {
            const trackerIDMem: TrackerIDMemory = new Map()
            for (const trackerID in response.data) {
                trackerIDMem.set(trackerID, response.data[trackerID])
            }
            filterResponse.value = trackerIDMem
        })
        .catch((err) => {
            errorMessageStore.handleError(err)
        }).finally(() => {
            querySent.value = false
        })
}

onMounted(() => search())
</script>


<style scoped>
.display-people {
    max-height: 75vh;
}

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


.loading-spinner {
    position: fixed;
    /* Ensures it stays in the middle of the viewport */
    top: 50%;
    left: 50%;
}
</style>
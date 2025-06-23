<template>
    <v-row class="filter-row">
        <v-autocomplete v-model="selectedFeature" :items="props.remainingFeatures" label="Select filter" clearable dense
            hide-details class="filter-select" variant="outlined"></v-autocomplete>

        <v-combobox v-model="input" :items="props.suggestions" label="Search..." clearable dense hide-details
            class="filter-select" variant="outlined"></v-combobox>

        <v-btn class="error-btn" variant="tonal" :disabled="!props.canRemove" prepend-icon="mdi-delete" rounded="lg"
            @click="deleteFilter">
            Delete filter
        </v-btn>
    </v-row>
</template>

<script setup lang="ts">

import { ref, watch } from 'vue';
import "../styles/main.css";
import { FilterEmits, FilterProps, FilterState } from '../types';

// Define props with types
const props = defineProps<FilterProps>();
const emit = defineEmits<FilterEmits>();

// Initialize selectedFeature as a string or null and selectedRows as an array of strings
const selectedFeature = ref<string | null>(props.feature);
const input = ref<string>(props.value)

// When the selected feature changes, reset the input and notify parent
watch(selectedFeature, () => {
    input.value = ""; // Clear previous input
    const update: FilterState = {
        id: props.id,
        feature: selectedFeature.value,
        input: ""
    };
    emit('edit-filter', update);
});

// When the input changes, notify parent of the new value (lowercased)
watch(input, (newInput) => {
    if (newInput) {
        const update: FilterState = {
            id: props.id,
            feature: selectedFeature.value,
            input: newInput.toLowerCase()
        };
        emit('edit-filter', update);
    }

});

// Trigger delete event with current filter state
function deleteFilter() {
    const deletion: FilterState = { id: props.id, feature: selectedFeature.value, input: "" }
    emit('delete-filter', deletion)
}

</script>

<style scoped>
.filter-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.filter-select {
    background-color: var(--background);
    margin: 15px;
    flex: 1;
}
</style>

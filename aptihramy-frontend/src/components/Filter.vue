<template>
    <v-row class="filter-row">
        <v-autocomplete v-model="selectedColumn" :items="props.remainingColumns" label="Select filter" clearable
            class="filter-select"></v-autocomplete>

        <v-combobox v-model="rowInput" :items="props.suggestions" label="Search..." clearable
            class="filter-select"></v-combobox>

        <v-btn class="error-btn" :disabled="!canRemove" prepend-icon="mdi-delete" rounded="lg" @click="deleteFilter">
            Delete filter
        </v-btn>
    </v-row>
</template>

<script setup lang="ts">

import { ref, computed, watch, onMounted } from 'vue';
import "../styles/theme.css";
import "../styles/button.css";
import { FilterProps, FilterState } from '../types/types';
import { trackedFeaturesStore } from '../core/stores/trackedFeatures';

// Define props with types
const props = defineProps<FilterProps>();
const tfStore = trackedFeaturesStore()
const tracked_features = computed(() => tfStore.getTrackedFeatures)

const emit = defineEmits<{
    (event: 'edit-filter', payload: FilterState): void;
    (event: 'delete-filter', payload: FilterState): void;
}>();

// Initialize selectedColumn as a string or null and selectedRows as an array of strings
const selectedColumn = ref<string | null>(null);
const rowInput = ref<string>("")

// Watch for column change and reset selectedRows
watch(selectedColumn, () => {
    rowInput.value = "";
    const a: FilterState = { id: props.id, column: selectedColumn.value, rowInput: "" }
    emit('edit-filter', a);
});

watch(rowInput, (input) => {
    const a: FilterState = { id: props.id, column: selectedColumn.value, rowInput: input }
    emit('edit-filter', a);
});

function deleteFilter() {
    const a: FilterState = { id: props.id, column: selectedColumn.value, rowInput: "" }
    emit('delete-filter', a)
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
    flex: 1;
}
</style>

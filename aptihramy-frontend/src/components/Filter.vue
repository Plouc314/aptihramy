<template>
    <v-row class="filter-row">
        <v-autocomplete v-model="selectedColumn" :items="remainingColumns" label="Select filter" clearable
            class="filter-select"></v-autocomplete>

        <v-autocomplete v-model="selectedRows" :items="suggestions" label="Search..." clearable multiple
            class="filter-select"></v-autocomplete>

        <v-btn class="error-btn" :disabled="!canRemove" prepend-icon="mdi-delete" rounded="lg" @click="deleteFilter">
            Delete filter
        </v-btn>
    </v-row>
</template>

<script setup lang="ts">
import { COLUMN_PRETTY_TO_RAW } from '@/config/constants';
import { FIRST_RECORDS } from '@/config/test_data';
import { ref, computed, watch } from 'vue';
import "../styles/theme.css";
import "../styles/button.css";
import { FilterProps, FilterState } from '../types/types';

// Define props with types
const props = defineProps<FilterProps>();

const emit = defineEmits<{
    (event: 'edit-filters', payload: { column: string | null; rows: string[] }): void;
    (event: 'delete-filter', payload: { id: number; column: string | null }): void;
}>();

// Initialize selectedColumn as a string or null and selectedRows as an array of strings
const selectedColumn = ref<string | null>(null);
const selectedRows = ref<string[]>([]);

// Watch for column change and reset selectedRows
watch(selectedColumn, () => {
    selectedRows.value = [];
});

// Watch for row changes and emit event
watch(selectedRows, (newRows) => {
    const a: FilterState = { id: props.id, column: selectedColumn.value, rows: newRows }
    emit('edit-filters', a);
});

// Compute raw column name based on selectedColumn
const rawColName = computed(() => COLUMN_PRETTY_TO_RAW.get(selectedColumn.value) as string | undefined);

// Compute suggestions based on raw column name
const suggestions = computed((): string[] => {
    const uniques = new Set<string>();

    FIRST_RECORDS
        .map(value => value[rawColName.value as keyof typeof value])
        .filter(value => value != null)
        .forEach(value => uniques.add(value as string));

    return Array.from(uniques.values());
});


function deleteFilter() {
    const a: FilterState = { id: props.id, column: selectedColumn.value, rows: [] }
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

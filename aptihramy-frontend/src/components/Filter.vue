<template>
    <v-row class="filter-row">
        <v-autocomplete v-model="selectedColumn" :items="remainingColumns" label="Select filter" clearable
            class="filter-select"></v-autocomplete>

        <v-autocomplete v-model="selectedRows" :items="suggestions" label="Search..." clearable multiple
            class="filter-select"></v-autocomplete>

        <v-btn :disabled="!canRemove" prepend-icon="mdi-delete" color="red" rounded="lg"
            @click="emit('delete-filters', { id: id, column: selectedColumn })" class="filter-button">
            Delete filter
        </v-btn>
    </v-row>
</template>

<script setup lang="ts">
import { COLUMN_TRANSLATION, COLUMNS } from '@/config/constants';
import { FIRST_RECORDS } from '@/config/test_data';
import { ref, computed, watch } from 'vue';

// Define props with types
const props = defineProps<{
    canRemove: boolean;
    id: number;
    remainingColumns: string[];
}>();

const emit = defineEmits<{
    (event: 'edit-filters', payload: { column: string | null; rows: string[] }): void;
    (event: 'delete-filters', payload: { id: number; column: string | null }): void;
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
    emit('edit-filters', { column: selectedColumn.value, rows: newRows });
});

// Compute raw column name based on selectedColumn
const rawColName = computed(() => COLUMN_TRANSLATION.get(selectedColumn.value) as string | undefined);

// Compute suggestions based on raw column name
const suggestions = computed((): string[] => {
    const uniques = new Set<string>();

    FIRST_RECORDS
        .map(value => value[rawColName.value as keyof typeof value])
        .filter(value => value != null)
        .forEach(value => uniques.add(value as string));

    return Array.from(uniques.values());
});
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

.filter-button {
    height: 40px;
    display: flex;
    align-items: center;
}
</style>

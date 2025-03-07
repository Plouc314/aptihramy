<template>
    <v-row class="filter-row">
        <v-autocomplete v-model="selectedColumn" :items="remainingColumns" label="Select filter" clearable
            class="filter-select"></v-autocomplete>
        <v-autocomplete v-model="selectedRows" :items="suggestions" label="Search..." clearable multiple
            class="filter-select"></v-autocomplete>
        <v-btn :disabled="!canRemove" prepend-icon="mdi-delete" color="red" rounded="lg"
            @click="$emit('deleteFilter', { id: props.id, column: selectedColumn })" class="filter-button">
            Delete filter
        </v-btn>
    </v-row>
</template>

<script setup>
import { COLUMN_TRANSLATION, COLUMNS } from '@/config/constants';
import { FIRST_RECORDS } from '@/config/test_data';
import { ref, computed, watch, defineProps } from 'vue';

const emit = defineEmits(['edit-filters']);

// Initialize selectedColumn as a string and selectedRecord as an array
const selectedColumn = ref(null);
const selectedRows = ref([]);


const props = defineProps({
    canRemove: Boolean,
    id: Number,
    remainingColumns: {
        type: Array,
        default: COLUMNS
    }
});


watch(selectedColumn, (newValue) => {
    selectedRows.value = []; // Clear the selected records when the column changes
});

watch(selectedRows, (newRows) => {
    emit('edit-filters', { column: selectedColumn.value, rows: newRows })
})

const rawColName = computed(() => COLUMN_TRANSLATION.get(selectedColumn.value));

const suggestions = computed(() => {
    const uniques = new Set();

    FIRST_RECORDS
        .map(value => value[rawColName.value])
        .filter(value => value != null)
        .forEach(value => uniques.add(value));

    return [...uniques];
});

</script>

<style scoped>
.filter-row {
    display: flex;
    align-items: center;
    /* Align items vertically in the center */
    justify-content: center;
    /* Center items horizontally */
    gap: 16px;
}

.filter-select {
    flex: 1;
}

.filter-button {
    height: 40px;
    /* Match the height of the select elements */
    display: flex;
    align-items: center;
}
</style>
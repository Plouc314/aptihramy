<template>
    <test></test>
    <v-col>
        <v-card class="header-card">
            <v-row v-for="id in filters" :key="id" class="filter">
                <Filter :can-remove="filters.length != 1" :id="id"
                    :remaining-columns="Array.from(remainingColumns.values())" @delete-filter="deleteFilter"
                    @edit-filters="editFilters">
                </Filter>
            </v-row>
            <v-btn class="ok-btn" prepend-icon="mdi-plus" rounded="lg" @click="createFilter">Add
                Filter</v-btn>
        </v-card>
        <display-people :selected-columns-rows="selectedColumnRows"></display-people>
    </v-col>

</template>

<script setup lang="ts">
import { COLUMNS_PRETTY } from '@/config/constants';
import DisplayPeople from '@/components/DisplayPeople.vue';
import { ref, computed } from 'vue';
import Filter from '@/components/Filter.vue';
import { useRouter } from 'vue-router';
import test from '@/components/CrashTest2.vue';
import '../styles/theme.css';
import '../styles/button.css';


interface FilterValue {
    id: number;
    column: string;
    rows: any[];
}

// Reactive state with types
const selectedColumnRows = ref<Map<string, any>>(new Map()); // Key is column name, value is rows
//const remainingColumns = ref<Set<string>>(new Set([...COLUMNS_PRETTY]));

const remainingColumns = computed(() => new Set([...COLUMNS_PRETTY].filter(e => !selectedColumnRows.value.has(e))))

const router = useRouter();


const filters = ref<number[]>([1]);
let id = 1;

// Create a new filter
function createFilter(): void {
    id += 1;
    filters.value.push(id);
}

// Delete a filter
function deleteFilter(value: FilterValue): void {
    const { id: idToRemove, column: colToRemove } = value;

    // Remove from filters array
    filters.value = filters.value.filter(id => id !== idToRemove);

    // Remove from selectedColumnRows if it exists
    selectedColumnRows.value.delete(colToRemove);
}

// Edit filters
function editFilters(value: FilterValue): void {
    // No rows are selected anymore for this column
    if (value.rows.length === 0) {
        selectedColumnRows.value.delete(value.column);

    }
    // New rows for the column
    if (value.rows.length > 0) {
        selectedColumnRows.value.set(value.column, value.rows);
    }
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
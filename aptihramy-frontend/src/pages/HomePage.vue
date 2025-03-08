<template>
    <v-btn @click="goToUser(5)">Go to User 5</v-btn>
    <v-col>
        <v-card class="header-card">
            <v-row v-for="id in filters" :key="id" class="filter">
                <Filter :can-remove="filters.length != 1" :id="id"
                    :remaining-columns="Array.from(remainingColumns.values())" @delete-filter="deleteFilter"
                    @edit-filters="editFilters">
                </Filter>
            </v-row>
            <v-btn prepend-icon="mdi-plus" color="blue" rounded="lg" @click="createFilter">Add Filter</v-btn>
        </v-card>
        <display-people :selected-columns-rows="selectedColumnRows"></display-people>
    </v-col>

</template>

<script setup lang="ts">
import { COLUMNS } from '@/config/constants';
import DisplayPeople from '@/components/DisplayPeople.vue';
import { ref } from 'vue';
import Filter from '@/components/Filter.vue';
import { useRouter } from 'vue-router';

interface FilterValue {
    id: number;
    column: string;
    rows: any[];
}

// Reactive state with types
const selectedColumnRows = ref<Map<string, any>>(new Map()); // Key is column name, value is rows
const remainingColumns = ref<Set<string>>(new Set([...COLUMNS]));

const router = useRouter();

const goToUser = (userId: number) => {
    router.push({ name: 'TrackingChain', params: { id: userId } });
};

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
    if (selectedColumnRows.value.has(colToRemove)) {
        selectedColumnRows.value.delete(colToRemove);
    }

    // Add back to remaining columns
    remainingColumns.value.add(colToRemove);
}

// Edit filters
function editFilters(value: FilterValue): void {
    if (value.rows.length === 0 && selectedColumnRows.value.has(value.column)) {
        selectedColumnRows.value.delete(value.column);
        remainingColumns.value.add(value.column);
    }
    if (value.rows.length > 0) {
        selectedColumnRows.value.set(value.column, value.rows);
        remainingColumns.value.delete(value.column);
    }
}
</script>


<style scoped>
.header-card {
    padding: 30px;
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    color: #555;
    font-weight: bold;
}

.filter-select .v-input__control {
    min-height: 40px;
}

.filter-select .v-select__selection {
    color: #333;
}
</style>
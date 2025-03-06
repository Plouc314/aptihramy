<template>
    <v-col>
        <v-card class="header-card">
            <v-row v-for="id in filters" :key="id" class="filter">
                <Filter :can-remove="filters.length != 1" :id="id" :remaining-columns="[...remainingColumns]"
                    @delete-filter="deleteFilter" @edit-filters="editFilters">
                </Filter>
            </v-row>
            <v-btn prepend-icon="mdi-plus" color="blue" rounded="lg" @click="createFilter">Add Filter</v-btn>
        </v-card>
        <display-people :selected-columns-rows="selectedColumnRows"></display-people>
    </v-col>

</template>

<script setup>
import { COLUMN_TRANSLATION, COLUMNS } from '@/config/constants';
import DisplayPeople from '@/components/DisplayPeople.vue';
import { ref, computed, watch } from 'vue';
import Filter from '@/components/Filter.vue';

const selectedColumnRows = ref(new Map());
const remainingColumns = ref(new Set([...COLUMNS]))

const filters = ref([1]);
let id = 1


function createFilter() {
    id += 1
    filters.value.push(id)
}

function deleteFilter(value) {
    const idToRemove = value.id
    const colToRemove = value.column
    filters.value = filters.value.filter(id => id != idToRemove)

    if (selectedColumnRows.value.has(colToRemove)) {
        selectedColumnRows.value.delete(colToRemove)
    }

    remainingColumns.value.add(value.column)
}

function editFilters(value) {
    if (value.rows.length == 0 && selectedColumnRows.value.has(value.column)) {
        selectedColumnRows.value.delete(value.column)
        remainingColumns.value.delete(value.column)
    }
    if (value.rows.length > 0) {
        selectedColumnRows.value.set(value.column, value.rows)
        remainingColumns.value.delete(value.column)
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
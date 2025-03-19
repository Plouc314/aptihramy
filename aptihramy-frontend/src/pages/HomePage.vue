<template>
    <v-col>
        <ShowImage></ShowImage>
        <v-btn @click="apiRequest">OUIIIIIIIIIIII</v-btn>
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
import { ref, computed, onMounted } from 'vue';
import axios from "axios";
import Filter from '@/components/Filter.vue';
import { useRouter } from 'vue-router';
import { ColumnRows, FilterState } from "../types/types"
import '../styles/theme.css';
import '../styles/button.css';
import ShowImage from '@/components/ShowImage.vue';


// Reactive state with types
const selectedColumnRows = ref<ColumnRows>(new Map()); // Key is column name, value is rows

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
function deleteFilter(value: FilterState): void {
    const { id: idToRemove, column: colToRemove } = value;

    // Remove from filters array
    filters.value = filters.value.filter(id => id !== idToRemove);

    // Remove from selectedColumnRows if it exists
    selectedColumnRows.value.delete(colToRemove);
}

// Edit filters
function editFilters(value: FilterState): void {
    // No rows are selected anymore for this column
    if (value.rows.length === 0) {
        selectedColumnRows.value.delete(value.column);

    }
    // New rows for the column
    if (value.rows.length > 0) {
        selectedColumnRows.value.set(value.column, value.rows);
    }
}



const data = ref(null);

onMounted(async () => {
    try {
        const response = await axios.get("http://127.0.0.1:8000/items/2?q=test");
        data.value = response.data;
        console.log(data.value)
    } catch (error) {
        console.error("Axios error:", error);
    }
});

function apiRequest() {
    axios.get(`http://127.0.0.1:8000/`)
        .then(response => {
            if (response.data) {
                console.log(response.data)
            }
        })
        .catch(error => {

            console.error('Error fetching posts:', error);
        });
};
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
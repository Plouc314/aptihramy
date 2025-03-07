<template>
    <v-card class="display-card">
        <v-row>
            <v-card-title class="text-h6">Person Matching</v-card-title>
        </v-row>

        <!-- Table Header -->
        <v-row class="table-header-row">
            <v-col class="table-header-text" v-for="(column, index) in COLUMNS" :key="index">
                {{ column }}
            </v-col>
        </v-row>
        <div class="table-body">
            <template v-for="(record, recordIndex) in filtredData" :key="recordIndex">
                <v-row :class="['table-data-row', { 'table-alternate-data-row': recordIndex % 2 === 0 }]">
                    <v-col class="table-data-text" v-for="(column, index) in COLUMNS" :key="index">
                        {{ record[COLUMN_TRANSLATION.get(column)] }}
                    </v-col>
                </v-row>
            </template>
        </div>

    </v-card>
</template>

<script setup>
import { ref, computed, defineProps, watch } from 'vue';
import { COLUMN_TRANSLATION, COLUMNS } from '@/config/constants';
import { TEST_DATA, TEST_DATA_1805, FIRST_RECORDS } from '@/config/test_data';
import '../styles/table.css'
const props = defineProps({
    selectedColumnsRows: {
        type: Map,
        default: new Map()
    }
});


const filtredData = computed(() => {
    let ret = FIRST_RECORDS

    for (const [column, rows] of props.selectedColumnsRows) {
        const rawCol = COLUMN_TRANSLATION.get(column)

        const filtered = ret.filter(value => rows.includes(value[rawCol]));
        ret = filtered
    }
    return ret
})


</script>

<style scoped>
.display-card {
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background-color: #ffffff;

    display: flex;
    flex-direction: column;
    max-height: 80vh;
    /* Ensures the component does not exceed 90% of screen height */
    overflow: hidden;
    /* Prevents the card itself from scrolling */
    border-radius: 12px;
    color: white;
}

.text-h6 {
    color: #0056b3;
    font-weight: bold;
    margin: 10px;
    text-align: center;
}
</style>
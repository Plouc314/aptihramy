<template>
    <v-card class="display-card">
        <v-row>
            <v-card-title class="text-h6">Person Matching</v-card-title>
        </v-row>

        <!-- Table Header -->
        <v-row class="header-row">
            <v-col class="header-text" v-for="(column, index) in COLUMNS" :key="index">
                {{ column }}
            </v-col>
        </v-row>
        <div class="error-list">
            <template v-for="(record, recordIndex) in filtredData" :key="recordIndex">
                <v-row :class="['data-row', { 'alternate-row': recordIndex % 2 === 0 }]">
                    <v-col class="data-text" v-for="(column, index) in COLUMNS" :key="index">
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
.error-list {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
}

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

.header-row {
    background-color: #f0f0f0;
    border-bottom: 1px solid #e0e0e0;
    padding: 8px 0;
    display: flex;
    justify-content: center;
}

.header-text {
    font-weight: bold;
    color: #444;
    text-align: center;
}

.data-row {
    background-color: #f0f0f0;
    padding: 8px 0;
}

.alternate-row {
    background-color: white;
    padding: 8px 0;
}

.data-row:hover {
    background-color: #a8a8a8;
}

.data-text {
    color: #666;
    text-align: center;
}

.text-h6 {
    color: #0056b3;
    font-weight: bold;
    margin: 10px;
    text-align: center;
}
</style>
<template>
    <v-card class="display-card">
        <v-row>
            <v-card-title class="text-h6">Person Matching</v-card-title>
        </v-row>

        <!-- Table Header -->
        <v-row class="table-header-row">
            <v-col class="table-header-text" v-for="(column, index) in COLUMNS_PRETTY" :key="index">
                {{ column }}
            </v-col>
        </v-row>

        <div class="table-body">
            <template v-for="(record, recordIndex) in filteredData" :key="recordIndex">
                <v-row :class="['table-data-row', { 'table-alternate-data-row': recordIndex % 2 === 0 }]"
                    @click="handleRowClick(record.index)">
                    <v-col class="table-data-text" v-for="(column, index) in COLUMNS_PRETTY" :key="index">
                        {{ record.value[COLUMN_PRETTY_TO_RAW.get(column) as string] }}
                    </v-col>
                </v-row>
            </template>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { COLUMN_PRETTY_TO_RAW, COLUMNS_PRETTY } from '@/config/constants';
import { FIRST_RECORDS } from '@/config/test_data';
import { useRouter } from 'vue-router';
import '../styles/table.css';
import '../styles/theme.css';

// Define the shape of a record
interface ValueType {
    [key: string]: string | number
}
// Define the full object that includes the 'value' and 'index' fields
interface RecordType {
    value: ValueType;
    index: number;
}

// Define props
const props = defineProps<{
    selectedColumnsRows: Map<string, string[]>;
}>();
const router = useRouter();

// Row click handler
const handleRowClick = (index: number): void => {
    router.push({ name: 'TrackingChain', params: { trackedPersonIndex: index } });
};

const firstRecordIndex = FIRST_RECORDS.map((v, i) => { return { value: v, index: i } })

// Computed filtered data
const filteredData = computed<RecordType[]>(() => {
    let result = [...firstRecordIndex];

    props.selectedColumnsRows.forEach((rows, col) => {
        const rawCol = COLUMN_PRETTY_TO_RAW.get(col);
        if (rawCol != "") {
            result = result.filter(record => rows.includes(record.value[rawCol]));
        }

    })
    return result
});
</script>

<style scoped>
.display-card {
    border-radius: 8px;
    box-shadow: 0 4px 8px "box-shadow";
    background-color: "background";
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    overflow: hidden;
    border-radius: 12px;
    color: "surface"
}

.text-h6 {
    color: "primary";
    font-weight: bold;
    margin: 10px;
    text-align: center;
}
</style>

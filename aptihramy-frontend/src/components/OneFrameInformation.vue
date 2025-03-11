<template>
    <v-card class="card">
        <v-row justify="space-between" no-gutters>
            <!-- Title aligned to the left -->
            <v-col cols="6">
                <v-card-title class="title-text">{{ title }}</v-card-title>
            </v-col>

            <!-- Button aligned to the right -->
            <v-col cols="6" class="text-center">
                <v-btn class="ok-btn" @click="showPage" prepend-icon="mdi-book-open-page-variant">Show Page</v-btn>
            </v-col>
        </v-row>
        <v-divider :thickness="3" color="info"></v-divider>

        <div class="content">
            <v-card-item>
                <v-row>
                    <v-col v-for="(value, col) in frameInformation" :key="col" :cols="12 / columns" class="data-col">
                        <span class="data-title">{{ COLUMN_RAW_TO_PRETTY.get(col) }}</span>
                        <span class="data-value">{{ value }}</span>
                    </v-col>
                </v-row>
            </v-card-item>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { TEST_DATA } from '@/config/test_data';
import { ref, computed } from "vue";
import { COLUMN_RAW_TO_PRETTY } from '@/config/constants';
import '../styles/theme.css';
import '../styles/button.css';

const props = defineProps<{
    trackedPersonIndex: number;
    frameIndex: number;
    columns: number;
}>();

const frameInformation = computed(() => TEST_DATA[props.trackedPersonIndex][props.frameIndex]);
const title = computed(() => `${frameInformation.value.chef_prenom} ${frameInformation.value.chef_nom}`);

function showPage() {

}

</script>



<style>
.card {
    display: flex;
    flex-direction: column;
    max-height: 50vh;
    border-radius: 12px;
    background-color: var(--background);
    color: var(--text-primary);
    box-shadow: 0px 4px 10px var(--box-shadow);
}

.title-text {
    font-size: 20px;
    font-weight: bold;
    text-align: left;
    color: var(--primary);
    text-transform: uppercase;
}


.content {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 10px;
    max-height: 35vh;

}

.data-col {
    display: flex;
    flex-direction: column;
    padding: 8px 25px;
    border-bottom: 1px solid var(--box-shadow);

    &:last-child {
        border-bottom: none;
        margin-bottom: 1px;
    }
}

.data-value {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 16px;
}

.data-title {
    font-weight: bold;
    color: var(--text-secondary);
    font-size: 14px;
    text-transform: uppercase;

}
</style>

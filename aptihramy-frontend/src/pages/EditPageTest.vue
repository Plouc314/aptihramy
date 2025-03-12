<template>
    <v-col>
        <v-card class="pa-4">
            <v-row>
                <v-col class="d-flex align-center">
                    <v-tooltip location="bottom">
                        <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" @click="goBack">
                                mdi-arrow-left
                            </v-icon>
                        </template>
                        <span>Back</span>
                    </v-tooltip>

                    <v-card-title class="card-title">Edit Page</v-card-title>
                </v-col>

                <v-col class="d-flex justify-end">
                    <v-btn color="secondary" @click="goToHomePage" size="large" v-bind="props" class="mx-2">
                        <template v-slot:prepend>
                            <v-icon>mdi mdi-home</v-icon>
                        </template>
                        Home
                    </v-btn>
                </v-col>
            </v-row>
        </v-card>
        <v-row>
            <v-col v-for="(rawCol, index) in COLUMNS_RAW" :key="index" cols="12" md="6">
                <v-card>
                    <v-card-title class="title-text">{{ COLUMN_RAW_TO_PRETTY.get(rawCol) }}</v-card-title>
                    <v-card-subtitle class="subtitle-text">
                        Most probable option: {{ personCleanedData[rawCol] }} (0.5 %)
                    </v-card-subtitle>

                    <v-divider :thickness="3" color="info"></v-divider>

                    <!-- Unique v-model for each card using selectedValues object -->
                    <v-select v-model="selectedValues[rawCol]" :items="getAllForCol(rawCol)"
                        label="Select an option"></v-select>
                </v-card>
            </v-col>
        </v-row>
    </v-col>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { CLEANED, TEST_DATA } from "@/config/test_data";
import { COLUMNS_PRETTY, COLUMNS_RAW, COLUMN_RAW_TO_PRETTY } from "@/config/constants";
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
    trackedPersonIndex: number;
}>();
const router = useRouter();
const route = useRoute();

const personRawData = computed(() => TEST_DATA[props.trackedPersonIndex]);
const personCleanedData = computed(() => CLEANED[props.trackedPersonIndex])

function getAllForCol(col: string) {
    let ret = new Set<String>()
    personRawData.value.forEach((value) => { if (value[col]) ret.add(value[col]) })
    return Array.from(ret)
}
// Reactive object to store selected values for each card
const selectedValues = reactive(personCleanedData.value);


function goToHomePage() {
    router.push({ name: 'HomePage' });
}

function goBack() {
    router.back()
}
</script>

<style scoped>
.subtitle-text {
    font-size: 18px;
    /* Increase font size */
    color: var(--text-primary);
    /* Optional: Adjust color */
}

.card-title {
    color: var(--primary)
}
</style>
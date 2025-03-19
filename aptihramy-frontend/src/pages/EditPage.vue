<template>
    <v-col>
        <TopBar title="Edit Page"></TopBar>
        <v-row>
            <v-col v-for="(rawCol, index) in COLUMNS_RAW" :key="index" cols="12" md="6">
                <v-card>
                    <v-card-title class="title-text">{{ COLUMN_RAW_TO_PRETTY.get(rawCol) }}</v-card-title>
                    <v-card-subtitle class="subtitle-text">
                        Most probable option: {{ personCleanedData[rawCol] }} (50 %)
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
import { COLUMNS_RAW, COLUMN_RAW_TO_PRETTY } from "@/config/constants";
import { useRoute, useRouter } from 'vue-router';
import TopBar from "@/components/TopBars/TopBar.vue";
import { EditPageProps } from "@/types/types";

const props = defineProps<EditPageProps>();

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
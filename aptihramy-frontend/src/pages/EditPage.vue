<template>
    <v-container>
        <v-list>
            <v-list-item v-for="option in options" :key="option" @click="selectedOption = option"
                :class="{ 'selected': selectedOption === option }">
                <v-list-item-title>{{ option }}</v-list-item-title>
            </v-list-item>
        </v-list>
        <p>Selected: {{ selectedOption }}</p>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { COLUMN_RAW_TO_PRETTY, COLUMN_PRETTY_TO_RAW, COLUMNS_PRETTY } from '@/config/constants';
import { TEST_DATA, CLEANED } from "@/config/test_data";
import '../styles/theme.css';
import '../styles/table.css'
import '../styles/button.css';

const props = defineProps<{
    trackedPersonIndex: number;
    columns: number;
}>();

const rawData = computed(() => TEST_DATA[props.trackedPersonIndex]);
const cleaned = computed(() => CLEANED[props.trackedPersonIndex])


const options = ref(["Option 1", "Option 2", "Option 3"]);
const selectedOption = ref(null);
</script>

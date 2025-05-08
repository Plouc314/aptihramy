<template>

</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { COLUMN_RAW_TO_PRETTY, COLUMN_PRETTY_TO_RAW, COLUMNS_PRETTY } from '@/config/constants';
import { TEST_DATA, CLEANED } from "@/config/test_data";
import { getPanelColor } from "@/core/utils";
import { EditMetricsProps } from "../types/types";
import '../styles/theme.css';
import '../styles/table.css'
import '../styles/button.css';

const props = defineProps<EditMetricsProps>();


//const color = computed(() => getPanelColor(props.probability))
const options = ref(["Option 1", "Option 2", "Option 3"]);
const selectedOption = ref(null);
</script>

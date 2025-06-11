<template>
    <v-card class="display-card">
        <v-row>
            <v-card-title class="text-h6">Person Matching</v-card-title>
        </v-row>

        <!-- Table Header -->
        <v-row class="table-header-row">
            <v-col class="table-header-text" v-if="tracked_features"
                v-for="(column, index) in tracked_features.pretty_features" :key="index">
                {{ column }}
            </v-col>
        </v-row>
        <div class="table-body">
            <v-row v-for="([ID, record], index) of personToDisplay" :key="ID" class="table-data-row"
                @click="handleRowClick(ID)">
                <v-col class="table-data-text" v-for="(value, index) in record" :key="index">
                    {{ value }}
                </v-col>
            </v-row>
        </div>
    </v-card>
</template>

<script setup lang="ts">

import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import '../styles/main.css';
import { DisplayPeopleProps } from '../types/types';
import { trackerID } from '../types/api';
import { useTrackedFeaturesStore } from '@/core/stores/trackedFeatures';


const trackedFeaturesStore = useTrackedFeaturesStore()
const tracked_features = computed(() => trackedFeaturesStore.getTrackedFeatures)


// Define props
const props = defineProps<DisplayPeopleProps>();
const router = useRouter();

const personToDisplay = computed(() => {
    const m = new Map<trackerID, string[]>()
    props.data.forEach((memory, id) => {
        const mem = memory.map(m => m.length > 0 ? m[0] : "")
        m.set(id, mem)
    })
    return m
})

// Row click handler
const handleRowClick = (id: trackerID): void => {
    router.push({ name: 'TrackingChain', params: { trackerID: id } });
};

</script>

<style scoped>
.display-card {
    border-radius: 8px;
    box-shadow: 0 4px 8px "box-shadow";
    background-color: var(--background);
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

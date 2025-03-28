<template>

    <div v-if="trackerDiagnostics">
        <h2>{{ trackerDiagnostics }}</h2>
    </div>
    <div v-else>
        Loading...
    </div>
</template>

<script setup lang="ts">

import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import TopBar from '@/components/TopBars/TopBar.vue';
import { TrackinChainProps } from "../types/types"
import { Network, DataSet, Edge, Node, Options, Data } from 'vis-network';
import '../styles/theme.css';
import '../styles/button.css';
import { fetchTrackerInformation } from "@/core/api";
import { TrackerDiagnostics } from "@/types/api_types";

const trackerDiagnostics = ref<TrackerDiagnostics>(null);
const route = useRoute();

onMounted(() => {
    const param = Array.isArray(route.params.trackerID) ? route.params.trackerID[0] : route.params.trackerID ?? "";
    const trackerInformation = fetchTrackerInformation(param)
        .then(data =>
            trackerDiagnostics.value = data.diagnostic

        ).catch(err => console.log(err))

})

</script>
<template>
    <TopBar :go-to-edit-page="goToEditPage" :reset-zoom="resetZoom" title="title"></TopBar>
    <!-- Graph Row -->
    <v-row>
        <v-col cols="12" id="mynetwork"></v-col>
    </v-row>

</template>

<script setup lang="ts">

import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import TopBar from '@/components/TopBars/TopBar.vue';
import { TrackinChainProps } from "../types/types"
import { Network, DataSet, Edge, Node, Options, Data, IdType } from 'vis-network';
import '../styles/theme.css';
import '../styles/button.css';
import '../styles/error_card.css';

import { fetchRecordValues, fetchTrackedYears, fetchTrackerInformation } from "@/core/api";
import { TrackerDiagnostics } from "@/types/api_types";
import { useSnackbarQueue } from '@/core/snackbarQueue';

const trackerDiagnostics = ref<TrackerDiagnostics>(null);
const route = useRoute();
const network = ref<Network>(null);
const container = ref<HTMLElement | null>(null);
const trackedYears = ref<number[]>()
const selectedNodeId = ref(null)
const error = ref(false)
const { addSnackbar, snackbarTypes } = useSnackbarQueue();



const props = defineProps<TrackinChainProps>();

const oui = [1, 2, 4, 5]

const nodes = ref(oui.map((year, index) => ({
    id: index,
    label: `${year}`,
    shape: "box",
    color: "#0056B3",
    font: {
        size: 24,
        color: "#ffffff",
        bold: "true"
    },
    x: index * 150,
    y: getRandomInt(-20, 20),
    fixed: { x: true, y: true }
})))


const edges = ref(oui.slice(0, -1).map((_, i) => ({
    from: i,
    to: i + 1,
    color: panelColor(0),
    width: 2,
    label: `${i}`,
    font: {
        size: 14, // Adjust size for readability
        color: "#007bff",
        align: "top",
        bold: "true"
    },
    arrows: "to",
})))


const options = ref({
    //autoResize: true,
    interaction: {
        dragNodes: false,
        dragView: false,
        hideEdgesOnDrag: false,
        hideEdgesOnZoom: false,
        hideNodesOnDrag: false,
        hover: true,
        hoverConnectedEdges: true,
        keyboard: false,
        multiselect: false,
        navigationButtons: false,
        selectable: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
        zoomSpeed: 1,
        zoomView: true
    },
    physics: {
        enabled: false, // Keep nodes in a fixed position
    },
});

const graph_data = computed<Data>(() => ({
    nodes: nodes.value,
    edges: edges.value,
}));

function setupNetwork() {
    container.value = document.getElementById("mynetwork");

    if (!container.value) {
        return
    }

    console.log("oui")
    network.value = new Network(
        container.value,
        graph_data.value,
        options.value
    );
    network.value.fit();
    // Click event to zoom in on a node
    network.value.on("click", function (params) {
        if (params.nodes.length > 0) {
            selectedNodeId.value = params.nodes[0];
            zoomTo(selectedNodeId.value)
        } else if (params.edges.length > 0) {
            alert(`You clicked on Edge ${params.edges[0]}`);
        }
    });

    // Hover event
    network.value.on("hoverNode", function (params) {
        const nodeId = params.node;
        console.log(trackedYears[nodeId]);
    });

    network.value.on("hoverEdge", function (params) {
        console.log("Hovering over edge:", params.edge);
    });

    network.value.on("blurEdge", function (params) {
        console.log("Stopped hovering over edge:", params.edge);
    });

}

function test() {
    fetchRecordValues(1, 1).then(v =>
        console.log(v.records)
    ).catch(err => addSnackbar(`Error fetching the person ${err}`, snackbarTypes.ERROR))
}


function panelColor(value) {
    // Convert percentage (0 to 100) to a color scale (green → red)
    const red = Math.min(255, Math.floor((1 - value) * 255));
    const green = Math.min(255, Math.floor((value) * 255));

    return `rgb(${red}, ${green}, 110)`;
};



function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

function changeNode(offset: number) {
    if (!trackedYears.value) return
    selectedNodeId.value = selectedNodeId.value === null ? 0 : (selectedNodeId.value + offset + trackedYears.value.length) % trackedYears.value.length
    zoomTo(selectedNodeId.value)
}

function nextNode() {
    changeNode(+1)
}

function previousNode() {
    changeNode(-1)
}

function goToEditPage() {
    // router.push({
    //     name: 'EditPage', params: { trackedPersonIndex: props.trackedPersonIndex.valueOf() }
    // });
}

function zoomTo(nodeId: IdType) {
    nextTick(() => {
        network.value?.focus(nodeId, {
            scale: 5, // Zoom in
            animation: { duration: 1000, easingFunction: "easeInOutQuad" },
        });
    });
}

// Reset zoom function
function resetZoom() {
    nextTick(() => {
        network.value?.fit({
            animation: { duration: 500, easingFunction: "easeInOutQuad" },
        });
    })
    selectedNodeId.value = null

};



onMounted(() => {
    const param = props.trackerID
    setupNetwork()

})
</script>

<style scoped>
#mynetwork {
    height: 50vh;
}

.error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    /* Full viewport height */
    width: 100%;
    /* Full width */
}

.loading-spinner {
    position: fixed;
    /* Ensures it stays in the middle of the viewport */
    top: 50%;
    left: 50%;
}

.navigation-buttons {
    display: flex;
    align-items: center;
    gap: 40px;
    /* Increased space between buttons */
    margin-top: 20px;
}

.navigation-buttons span {
    font-size: 16px;
    font-weight: bold;
    /* Same color as the button icons */
    margin-top: 5px;
    /* Adjusts the spacing between icon and text */
}

.card-title {
    color: var(--primary)
}
</style>
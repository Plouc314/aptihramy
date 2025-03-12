<template>
    <TrackingChainTopBar :go-to-edit-page="goToEditPage" :reset-zoom="resetZoom" :title="title"></TrackingChainTopBar>
    <v-col>
        <!-- Navigation Buttons -->
        <v-row class="navigation-buttons" justify="center">
            <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                    <v-btn icon color="primary" @click="previousNode" large v-bind="props">
                        <v-icon>mdi-chevron-left</v-icon> <!-- Left Arrow -->
                    </v-btn>
                </template>
                <span>Previous node</span>
            </v-tooltip>


            <v-tooltip bottom>
                <template v-slot:activator="{ props }">
                    <v-btn icon color="primary" @click="nextNode" large v-bind="props">
                        <v-icon>mdi-chevron-right</v-icon> <!-- Right Arrow -->
                    </v-btn>
                </template>
                <span>Next node</span>
            </v-tooltip>
        </v-row>
        
        <!-- Graph Row -->
        <v-row>
            <v-col cols="12" id="mynetwork"></v-col>
        </v-row>


        <!-- Information Section Below -->
        <v-row>
            <v-col v-if="selectedNodeId !== null" cols="12">
                <OneFrameInformation :frame-index="selectedNodeId" :tracked-person-index="trackedPersonIndex"
                    :columns="2" />
            </v-col>
        </v-row>
    </v-col>
</template>


<script setup lang="ts">
import { TEST_DATA } from '@/config/test_data';
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import TrackingChainTopBar from '@/components/TopBars/TrackingChainTopBar.vue';
import { TrackinChainProps } from "../types/types"
import { Network, DataSet, Edge, Node, Options, Data } from 'vis-network';
import '../styles/theme.css'
import '../styles/button.css'


const props = defineProps<TrackinChainProps>()

const router = useRouter();
const route = useRoute();
const network = ref(null);
const container = ref(null);

const selectedNodeId = ref(null)

const trackedPersonIndex = computed(() => Number(route.params.trackedPersonIndex));
const personToDisplay = TEST_DATA[trackedPersonIndex.value];

const title = ref("Track: " + personToDisplay[0].chef_prenom + " " + personToDisplay[0].chef_nom)


const nodes = computed<Node[]>(() =>
    personToDisplay.map((value, index) => ({
        id: index,
        label: `${value.annee}`,
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
    }))
);

function panelColor(value) {
    // Convert percentage (0 to 100) to a color scale (green → red)
    const red = Math.min(255, Math.floor((1 - value) * 255));
    const green = Math.min(255, Math.floor((value) * 255));

    return `rgb(${red}, ${green}, 110)`;
};

const edges = computed<Edge[]>(() =>
    personToDisplay.slice(0, -1).map((value, i) => ({
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
    }))
);


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

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
}

function nextNode() {
    selectedNodeId.value = selectedNodeId.value === null ? 0 : (selectedNodeId.value + 1 + personToDisplay.length) % personToDisplay.length
    zoomTo(selectedNodeId.value)
}

function previousNode() {
    selectedNodeId.value = selectedNodeId.value === null ? 0 : (selectedNodeId.value - 1 + personToDisplay.length) % personToDisplay.length
    zoomTo(selectedNodeId.value)
}

function selectSomeElse() {
    router.push({ name: 'HomePage' });
}

function goToEditPage() {
    console.log("TO BE IMPLEMENTED")
}

onMounted(() => {
    container.value = document.getElementById("mynetwork");

    if (!container.value) {
        return
    }
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
        console.log(personToDisplay[nodeId].annee);
    });

    network.value.on("hoverEdge", function (params) {
        console.log("Hovering over edge:", params.edge);
    });

    network.value.on("blurEdge", function (params) {
        console.log("Stopped hovering over edge:", params.edge);
    });
});


function zoomTo(nodeId) {
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

onUnmounted(() => {
    if (network.value) {
        network.value.destroy();
        network.value = null;
    }
});
</script>

<style>
#mynetwork {
    height: 50vh;
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


.test {
    justify-content: bottom;
    align-items: center;
}

.button {
    margin: 10px;
    padding: 8px 12px;
    font-size: 16px;
    background-color: "primary";
    color: "surface";
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.button:hover {
    background-color: "secondary";
}
</style>

<template>
    <TopBar :go-to-edit-page="goToEditPage" :reset-zoom="resetZoom" title=""></TopBar>
    <v-col v-if="trackedYears && trackerDiagnostics">
        <!-- Navigation Buttons -->
        <v-row justify="center" align="center">
            <v-col cols="auto">
                <v-tooltip location="start">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color="primary" @click="changeNode(-1, 0)" large v-bind="props">
                            <v-icon>mdi-chevron-left</v-icon>
                        </v-btn>
                    </template>
                    <span>Move left</span>
                </v-tooltip>
            </v-col>

            <!-- Up/Down Buttons Stacked -->
            <v-col cols="auto" class="d-flex flex-column align-center">
                <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color="primary" @click="changeNode(0, -1)" large v-bind="props">
                            <v-icon>mdi-chevron-up</v-icon>
                        </v-btn>
                    </template>
                    <span>Move Up</span>
                </v-tooltip>
                <v-divider thickness="20"></v-divider>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color="primary" @click="changeNode(0, 1)" large v-bind="props">
                            <v-icon>mdi-chevron-down</v-icon>
                        </v-btn>
                    </template>
                    <span>Move Down</span>
                </v-tooltip>
            </v-col>

            <v-col cols="auto">
                <v-tooltip location="end">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color="primary" @click="changeNode(1, 0)" large v-bind="props">
                            <v-icon>mdi-chevron-right</v-icon>
                        </v-btn>
                    </template>
                    <span>Move right</span>
                </v-tooltip>
            </v-col>
        </v-row>

        <!-- Graph Row -->
        <v-row>
            <v-col cols="12" id="network"></v-col>
        </v-row>

        <v-row>
            <v-col v-if="selectedNodeIndex !== null" cols="12">
                <OneFrameInformation :frame-idx="frameIdxRecordIdxs[selectedNodeIndex.x][0]"
                    :record-idx="frameIdxRecordIdxs[selectedNodeIndex.x][1][selectedNodeIndex.y]" :nb-columns="2" />
            </v-col>
        </v-row>

    </v-col>
    <v-progress-circular v-if="!trackerDiagnostics && !error" indeterminate :size="80" :width="10"
        class="loading-spinner"></v-progress-circular>
    <div v-if="error" class="error-container">
        <v-card class="error-card">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span class="error-text">Person not found</span>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup lang="ts">

import { useRoute, useRouter } from 'vue-router';
import { computed, ref, onMounted, watch, nextTick } from "vue";
import TopBar from '@/components/TopBars/TopBar.vue';
import { NodePosition, TrackinChainProps } from "../types/types"
import { Network, Edge, Node, IdType } from 'vis-network';
import '../styles/theme.css';
import '../styles/button.css';
import '../styles/error_card.css';

import { fetchRecordValues, fetchTrackedYears, fetchTrackerInformation, fetchTrackingChain } from "@/core/api";
import { ChainNode, TrackerDiagnostics, TrackerFrameDiagnostics } from "@/types/api_types";
import { useSnackbarQueue } from '@/core/snackbarQueue';
import { trackedYearsStore } from '../core/stores/trackedYears';
import { getColor } from '@/core/utils';

const ANGLE = 120
const RADIUS = 100
const OFFSET_X = 150

const trackerDiagnostics = ref<TrackerDiagnostics | null>(null);
const tyStore = trackedYearsStore()
const trackedYears = computed(() => tyStore.getTrackedYears)

const network = ref<Network>(null);
const container = ref<HTMLElement | null>(null);
const tracking_chain = ref<ChainNode[] | null>(null)

const route = useRoute();
const router = useRouter();

const selectedNodeID = ref<string | null>(null)


const error = ref(false)
const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const nodes = ref<Node[]>(null)
const edges = ref<Edge[]>(null)

const props = defineProps<TrackinChainProps>();
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

const selectedNodeIndex = computed(() => {
    if (selectedNodeID.value == null) {
        return null
    }
    return decodeId(selectedNodeID.value)
})

const filteredTrackerDiagnosticsFrames = computed<TrackerFrameDiagnostics[]>(() => {
    if (!trackerDiagnostics.value) {
        return []
    }
    return trackerDiagnostics.value.frames.filter(frame => frame.records.length > 0).map(frame => {
        return {
            frame_idx: frame.frame_idx,
            memory: frame.memory,
            records: frame.records.sort((a, b) => b.record_score - a.record_score)
        }
    })
})


const frameIdxRecordIdxs = computed<[number, number[]][]>(() => {
    if (filteredTrackerDiagnosticsFrames.value.length == 0) {
        return []
    }
    const m: [number, number[]][] = []
    filteredTrackerDiagnosticsFrames.value.forEach(frame => m.push([frame.frame_idx, frame.records.map(_ => _.record_idx)]))
    return m
})

function getYearFromFrameIdx(frameIdx: number): number {

    if (!trackedYears.value) {
        return -1
    }

    if (0 <= frameIdx && frameIdx < trackedYears.value.length) {
        return trackedYears.value[frameIdx]
    }

    return -1
}

function encodeId(x: number, y: number): string {
    return `${x},${y}`;
}

function decodeId(id: string): NodePosition {
    const [x, y] = id.split(',').map(Number);
    return { x, y };
}

function setupEdges(filteredFrames: TrackerFrameDiagnostics[]) {
    const newEdges: Edge[] = []

    for (let i = 0; i < filteredFrames.length; i++) {
        const frame = filteredFrames[i]
        const nextIndex = filteredFrames.findIndex((frame, j) => j > i && frame.records.length > 0)

        if (nextIndex < 0) {
            continue
        }


        const nextFrame = filteredFrames[nextIndex]

        for (let r = 0; r < nextFrame.records.length; r++) {
            const e = {
                from: `${i},${0}`,
                to: `${nextIndex},${r}`,
                color: getColor(nextFrame.records[r].record_score),
                width: 2,
                label: `${Math.round(nextFrame.records[r].record_score * 100)}%`,
                font: {
                    size: 14, // Adjust size for readability
                    color: "#007bff",
                    align: "top",
                    bold: "true",
                },
                arrows: "to",
            }
            newEdges.push(e)
        }


    }

    edges.value = newEdges
}


function setupNodes(filteredFrames: TrackerFrameDiagnostics[]) {

    const newNodes: Node[] = []
    let centerX = 0
    for (let i = 0; i < filteredFrames.length; i++) {
        const frame = filteredFrames[i]

        const year = getYearFromFrameIdx(frame.frame_idx)

        if (year < 0) {
            continue
        }

        const positions = getNodePositions(centerX, ANGLE, RADIUS, frame.records.length)
        centerX += OFFSET_X

        for (let n = 0; n < frame.records.length; n++) {
            // Most probable matching node is in the middle
            const node = {
                id: `${i},${n}`,
                label: `${year}`,
                shape: "box",
                color: "#0056B3",
                font: {
                    size: 24,
                    color: "#ffffff",
                    bold: "true"
                },
                x: positions[n].x,
                y: positions[n].y,
                fixed: { x: true, y: true }
            }
            newNodes.push(node)
        }

    }
    nodes.value = newNodes
}

function getNodePositions(centerX: number, angleRange: number, radius: number, numNodes: number): NodePosition[] {
    if (numNodes == 1) {
        return [{ x: centerX + radius, y: 0 }]
    }

    let positions = [];
    let angleStep = angleRange / (numNodes - 1);

    for (let i = 0; i < numNodes; i++) {
        let angle = (-60 + i * angleStep) * (Math.PI / 180); // Convert to radians
        let x = centerX + radius;
        let y = radius * Math.sin(angle);
        positions.push({ x, y });
    }

    return positions;
}


function setupNetwork() {
    container.value = document.getElementById("network");
    if (!container.value) {
        return
    }
    network.value = new Network(
        container.value,
        {
            nodes: nodes.value,
            edges: edges.value,
        },
        options.value
    );
    network.value.fit();
    // Click event to zoom in on a node
    network.value.on("click", function (params) {
        if (params.nodes.length > 0) {
            selectedNodeID.value = params.nodes[0];
            zoomTo(selectedNodeID.value)
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

watch(filteredTrackerDiagnosticsFrames, newfilteredFrames => {
    if (newfilteredFrames) {
        setupNodes(newfilteredFrames)
        setupEdges(newfilteredFrames)
        nextTick(setupNetwork)
    }
})

function changeNode(offsetX: number, offsetY: number) {

    if (selectedNodeID.value == null) {
        selectedNodeID.value = encodeId(0, 0)
    } else {
        const decoded = decodeId(selectedNodeID.value)
        const records = filteredTrackerDiagnosticsFrames.value[decoded.x].records
        const x = (decoded.x + offsetX + filteredTrackerDiagnosticsFrames.value.length) % filteredTrackerDiagnosticsFrames.value.length
        const y = offsetX == 0 ? (decoded.y + offsetY + records.length) % records.length : 0
        selectedNodeID.value = encodeId(x, y)
    }
    zoomTo(selectedNodeID.value)
}


function goToEditPage() {
    router.push({
        name: 'EditPage', params: { trackerID: props.trackerID }
    });
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
    selectedNodeID.value = null

};



onMounted(() => {
    const param = props.trackerID
    fetchTrackerInformation(param)
        .then(data => {
            if (data.diagnostic) {
                trackerDiagnostics.value = data.diagnostic
            } else {
                addSnackbar("Person not found", snackbarTypes.ERROR)
                error.value = true
            }
        }
        ).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

    fetchTrackingChain(param)
        .then(data => {
            if (data.tracking_chain) {
                tracking_chain.value = data.tracking_chain
            } else {
                addSnackbar("Chain not found", snackbarTypes.ERROR)
                error.value = true
            }
        }).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

})
</script>

<style lang="scss" scoped>
#network {
    height: 50vh;
}


.navigation-buttons {
    align-items: center;
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
</style>
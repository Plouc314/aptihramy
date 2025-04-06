<template>
    <TopBar :go-to-edit-page="goToEditPage" :reset-zoom="resetZoom" title=""></TopBar>
    <v-col v-if="materializedTrackerFrames">
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
            <v-col v-if="selectedFrameRecordIdx !== null" cols="12">
                <OneFrameInformation :frame-idx="selectedFrameRecordIdx.frameIdx"
                    :diagnostic="selectedTrackerFrameDiagnostics" :record-idx="selectedFrameRecordIdx.recordIdx"
                    :nb-columns="2" />
            </v-col>
        </v-row>


    </v-col>

    <v-progress-circular v-if="!materializedTrackerFrames && !error" indeterminate :size="80" :width="10"
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
import { FrameRecordIdx, NodePosition, TrackinChainProps } from "../types/types"
import { Network, Edge, Node, IdType } from 'vis-network';
import '../styles/theme.css';
import '../styles/button.css';
import '../styles/error_card.css';

import { fetchMaterializedChain, fetchTrackerInformation, fetchTrackingChain } from "@/core/api";
import { ChainNode, MaterializedTrackerFrame, TrackerDiagnostics, TrackerFrameDiagnostics, TrackerFrameDiagnosticsTest } from "@/types/api_types";
import { useSnackbarQueue } from '@/core/snackbarQueue';
import { trackedYearsStore } from '../core/stores/trackedYears';
import { getColor } from '@/core/utils';

const ANGLE = 60
const OFFSET_X = 150

const tyStore = trackedYearsStore()

const network = ref<Network>(null);
const container = ref<HTMLElement | null>(null);
const materializedTrackerFrames = ref<MaterializedTrackerFrame[] | null>(null)

const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const route = useRoute();
const router = useRouter();

const selectedNodeID = ref<string | null>(null)

const error = ref(false)

const nodes = ref<Node[]>(null)
const edges = ref<Edge[]>(null)

const selectedFrameRecordIdx = computed<FrameRecordIdx>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }

    const mFrame = materializedTrackerFrames.value[selectedNodeIndex.value.x]
    const diag = mFrame.frame_diagnostic
    if (diag === null) {
        return { frameIdx: mFrame.frame_idx, recordIdx: mFrame.matching_record_idx }
    }
    return { frameIdx: mFrame.frame_idx, recordIdx: diag.records[selectedNodeIndex.value.y].record_idx }
})

const selectedTrackerFrameDiagnostics = computed<TrackerFrameDiagnosticsTest | null>(() => {
    if (selectedNodeIndex.value == null) {
        return null
    }

    return materializedTrackerFrames.value[selectedNodeIndex.value.x].frame_diagnostic
})

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

const selectedNodeIndex = computed<NodePosition | null>(() => {
    if (selectedNodeID.value == null) {
        return null
    }
    return decodeId(selectedNodeID.value)
})


function encodeId(x: number, y: number): string {
    return `${x},${y}`;
}

function decodeId(id: string): NodePosition {
    const [x, y] = id.split(',').map(Number);
    return { x, y };
}

function setupEdges(mFrames: MaterializedTrackerFrame[]) {


    const newEdges: Edge[] = []
    for (let i = 0; i < mFrames.length - 1; i++) {

        const nextNode = mFrames[i + 1]
        if (nextNode.frame_diagnostic === null) {
            // Error
            return
        }
        const records = nextNode.frame_diagnostic.records
        for (let r = 0; r < records.length; r++) {
            const record = records[r]

            const e = {
                from: encodeId(i, 0),
                to: encodeId(i + 1, r),
                color: getColor(record.record_score),
                width: 2,
                label: `${Math.round(record.record_score * 100) / 100}`,
                font: {
                    size: 14, // Adjust size for readability
                    color: "#007bff",
                    align: "top",
                    bold: "true",
                },
                arrows: "to",
                dashes: r != 0,
            }
            newEdges.push(e)
        }
    }
    edges.value = newEdges
}

function buildNode(id: string, year: number, positionX: number, positionY: number): Node {
    return {
        id: id,
        label: `${year}`,
        shape: "box",
        color: "#0056B3",
        font: {
            size: 24,
            color: "#ffffff",
            bold: "true"
        },
        x: positionX,
        y: positionY,
        fixed: { x: true, y: true }
    }
}

function setupNodes(mFrames: MaterializedTrackerFrame[]) {
    const newNodes: Node[] = []
    let centerX = 0

    if (mFrames.length == 0) {
        return
    }

    const year = tyStore.getYearFromFrameIdx(mFrames[0].frame_idx)
    newNodes.push(buildNode(encodeId(0, 0), year, 0, 0))

    for (let i = 1; i < mFrames.length; i++) {
        centerX += OFFSET_X

        const frame = mFrames[i]
        const year = tyStore.getYearFromFrameIdx(frame.frame_idx)

        const records = frame.frame_diagnostic.records
        const positions = getNodePositions(centerX - OFFSET_X, ANGLE, OFFSET_X, records.length)

        for (let r = 0; r < records.length; r++) {
            if (r == 0) {
                newNodes.push(buildNode(encodeId(i, 0), year, i * OFFSET_X, 0))
            } else {
                newNodes.push(buildNode(encodeId(i, r), year, positions[r - 1].x, positions[r - 1].y))
            }
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

    let a = angleStep
    for (let i = 0; i < Math.round(numNodes / 2); i++) {
        let angle = a * (Math.PI / 180); // Convert to radians
        let xPos = centerX + radius;
        let yPos = radius * Math.sin(angle);
        positions.push({ x: xPos, y: yPos });
        positions.push({ x: xPos, y: -yPos });
        a += angleStep

    }

    return positions.slice(0, numNodes);
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
            console.log(params)
            alert(`You clicked on Edge ${params}`);
        }
    });

    // Hover event
    network.value.on("hoverNode", function (params) {
        const nodeId = params.node;
    });

    network.value.on("hoverEdge", function (params) {
        console.log("Hovering over edge:", params.edge);
    });

    network.value.on("blurEdge", function (params) {
        console.log("Stopped hovering over edge:", params.edge);
    });

}

watch(materializedTrackerFrames, newMaterializedTrackerFrames => {
    if (newMaterializedTrackerFrames === null) {
        return
    }
    setupNodes(newMaterializedTrackerFrames)
    setupEdges(newMaterializedTrackerFrames)
    nextTick(() => setupNetwork())
})



function changeNode(offsetX: number, offsetY: number) {

    if (selectedNodeID.value == null) {
        selectedNodeID.value = encodeId(0, 0)
    } else {
        const decoded = decodeId(selectedNodeID.value)
        const diag = materializedTrackerFrames.value[decoded.x].frame_diagnostic
        const x = (decoded.x + offsetX + materializedTrackerFrames.value.length) % materializedTrackerFrames.value.length
        const y = diag !== null ? (decoded.y + offsetY + diag.records.length) % diag.records.length : 0
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
            scale: 3.5, // Zoom in
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

const trackingChain = ref(null)
const trackerDiagnostics = ref(null)
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

    fetchMaterializedChain(param)
        .then(data => {
            if (data.frames) {
                materializedTrackerFrames.value = data.frames
            }
        }).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))

    fetchTrackingChain(param)
        .then(data => {
            if (data.tracking_chain) {
                trackingChain.value = data.tracking_chain

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
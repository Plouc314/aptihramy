<template>
    <TopBarTrackingChain :go-to-edit-page="goToEditPage" :reset-zoom="resetZoom" title=""></TopBarTrackingChain>
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
            <v-col :style="networkStyle" id="network"></v-col>

        </v-row>

        <v-row>
            <v-col v-if="selectedFrameRecordIdx !== null">
                <OneFrameInformation :frame-idx="selectedFrameRecordIdx.frameIdx"
                    :record-idx="selectedFrameRecordIdx.recordIdx"
                    :recordValuesDiagnostic="selectedRecordValuesDiagnostic" :memory="selectedFrameMemory"
                    :nb-columns="3" @close="closeFrame" />

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
import { computed, ref, onMounted, watch, nextTick, hasInjectionContext } from "vue";
import { FrameRecordIdx, NodePosition, TrackinChainProps } from "../types/types"
import { Network, Edge, Node, IdType } from 'vis-network';
import '../styles/main.css';

import { fetchMaterializedFrames } from "@/core/api";
import { ChainNode, MaterializedTrackerFrame, RecordValuesDiag, TrackerInformation } from "@/types/api_types";
import { useSnackbarQueue } from '@/core/snackbarQueue';
import { trackedYearsStore } from '../core/stores/trackedYears';
import { getEdgeColor, getNodeColor } from '@/core/utils';
import TopBarTrackingChain from '@/components/TopBars/TopBarTrackingChain.vue';

const OFFSET_X = 150
const OFFSET_Y = 100

const tyStore = trackedYearsStore()

const network = ref<Network>(null);
const container = ref<HTMLElement | null>(null);
const materializedTrackerFrames = ref<MaterializedTrackerFrame[] | null>(null)

const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const route = useRoute();
const router = useRouter();

const networkStyle = computed(() => {
    return {
        height: selectedFrameRecordIdx.value ? '35vh' : '60vh',
    };
});


const selectedNodeID = ref<string | null>(null)

const error = ref(false)

const nodes = ref<Node[]>(null)
const edges = ref<Edge[]>(null)


const selectedNodeIndex = computed<NodePosition | null>(() => {
    if (selectedNodeID.value == null) {
        return null
    }
    return decodeId(selectedNodeID.value)
})


const selectedRecordValuesDiagnostic = computed<RecordValuesDiag | null>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }

    const mFrame = materializedTrackerFrames.value[selectedNodeIndex.value.x]
    return mFrame.records[selectedNodeIndex.value.y]
})

const selectedFrameMemory = computed<string[][]>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }
    return materializedTrackerFrames.value[selectedNodeIndex.value.x].memory
})

const selectedFrameRecordIdx = computed<FrameRecordIdx>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }

    const mFrame = materializedTrackerFrames.value[selectedNodeIndex.value.x]

    return { frameIdx: mFrame.frame_idx, recordIdx: mFrame.records[selectedNodeIndex.value.y].record_idx }

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

function closeFrame() {
    selectedNodeID.value = null
    resetZoom()
}

function encodeId(x: number, y: number): string {
    return `${x},${y}`;
}

function decodeId(id: string): NodePosition {
    const [x, y] = id.split(',').map(Number);
    return { x, y };
}

function buildEdge(from: string, to: string, color: string, label: string, dashes: boolean): Edge {
    return {
        from: from,
        to: to,
        color: color,
        width: 2,
        label: label,
        font: {
            size: 14,
            color: "#007bff",
            align: "top",
            bold: "true",
        },
        arrows: "to",
        dashes: dashes,
    }
}

function setupEdges(mFrames: MaterializedTrackerFrame[]) {


    const newEdges: Edge[] = []
    for (let i = 0; i < mFrames.length - 1; i++) {
        const currentFrame = mFrames[i]
        if (currentFrame.matching_record_idx == null) {
            continue
        }
        const nextFrame = mFrames[i + 1]

        // Next frame does not have a record index, create an edge to the next frame with a record index
        if (nextFrame.matching_record_idx == null) {

            const index = mFrames.findIndex((frame, index) => frame.matching_record_idx != null && index > i)
            if (index >= 0) {

                const nextMatchingRecords = mFrames[index].records

                for (let r = 0; r < nextMatchingRecords.length; r++) {

                    const recordDiagnostic = nextFrame.records[r].record_diagnostics

                    if (!recordDiagnostic) {
                        console.log("Setup edges: record does not have a diagnostic")
                        continue
                    }

                    newEdges.push(buildEdge(encodeId(i, 0), encodeId(index, r), getEdgeColor(recordDiagnostic.record_score), `${Math.round(recordDiagnostic.record_score * 100) / 100}`, r != 0))

                }
            }
        }

        const nextNodeRecords = nextFrame.records
        const hasMatchedYear = nextFrame.matching_record_idx != null

        for (let r = 0; r < nextNodeRecords.length; r++) {

            const recordDiagnostic = nextFrame.records[r].record_diagnostics
            if (!recordDiagnostic) {
                console.log("Setup edges: record does not have a diagnostic")
                continue
            }

            // console.log(mFrames[i].matching_record_idx)
            newEdges.push(buildEdge(encodeId(i, 0), encodeId(i + 1, r), getEdgeColor(recordDiagnostic.record_score), `${Math.round(recordDiagnostic.record_score * 100) / 100}`, r != 0 || !hasMatchedYear))
        }

        edges.value = newEdges
    }
}
function buildNode(id: string, year: number, positionX: number, positionY: number, matched: boolean): Node {
    return {
        id: id,
        label: `${year}`,
        shape: "circle",
        color: getNodeColor(matched),
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

    for (let i = 0; i < mFrames.length; i++) {
        centerX += OFFSET_X

        const frame = mFrames[i]
        const year = tyStore.getYearFromFrameIdx(frame.frame_idx)
        const hasMatchedYear = frame.matching_record_idx != null
        const records = frame.records

        const positions = getNodeYPositions(OFFSET_Y, records.length, hasMatchedYear)

        for (let r = 0; r < records.length; r++) {
            // console.log(positions)
            newNodes.push(buildNode(encodeId(i, r), year, i * OFFSET_X, positions[r], r == 0 && hasMatchedYear))
        }


    }

    nodes.value = newNodes
}

function getNodeYPositions(offsetY: number, numNodes: number, hasMatchedYear): number[] {
    let positions = [];

    let step = hasMatchedYear ? 0 : offsetY
    for (let i = 0; i < Math.round(numNodes / 2); i++) {
        positions.push(step)
        step += offsetY
    }

    step = -offsetY * Math.floor(numNodes / 2)
    for (let i = 0; i < Math.floor(numNodes / 2); i++) {
        positions.push(step)
        step += offsetY
    }
    return positions

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
        //console.log("Hovering over edge:", params.edge);
    });

    network.value.on("blurEdge", function (params) {
        //console.log("Stopped hovering over edge:", params.edge);
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
        const records = materializedTrackerFrames.value[decoded.x].records
        console.log(records)
        const x = (decoded.x + offsetX + materializedTrackerFrames.value.length) % materializedTrackerFrames.value.length
        const y = (decoded.y + offsetY + records.length) % records.length
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
            scale: 2, // Zoom in
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

    fetchMaterializedFrames(param)
        .then(data => {
            if (data.frames) {
                console.log(data.frames)
                materializedTrackerFrames.value = data.frames
            } else {
                addSnackbar("Person not found", snackbarTypes.ERROR)
                error.value = true
            }
        }
        ).catch(err => addSnackbar(`Error finding the person: ${err}`, snackbarTypes.ERROR))
})

</script>

<style lang="scss" scoped>
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
    color: var(--text-primary)
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
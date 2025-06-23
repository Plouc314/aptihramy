<template>
    <TopBar title="" :goBackBtn="true">
        <v-btn color="secondary" size="large" class="mx-2" @click="resetZoom">
            <template v-slot:prepend>
                <v-icon>mdi mdi-restore</v-icon>
            </template>
            Reset zoom
        </v-btn>

        <v-btn color="secondary" size="large" class="mx-2" @click="goToEditPage">
            <template v-slot:prepend>
                <v-icon>mdi mdi-pencil</v-icon>
            </template>
            Edit page
        </v-btn>
    </TopBar>

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
                        <v-btn icon color="primary" @click="changeNode(0, 1)" large v-bind="props">
                            <v-icon>mdi-chevron-up</v-icon>
                        </v-btn>
                    </template>
                    <span>Move Up</span>
                </v-tooltip>
                <v-divider thickness="20"></v-divider>
                <v-tooltip location="bottom">
                    <template v-slot:activator="{ props }">
                        <v-btn icon color="primary" @click="changeNode(0, -1)" large v-bind="props">
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
    <div v-if="error" class="error-container">
        <v-card class="error-card">
            <v-card-text class="error-content">
                <v-icon class="error-icon">mdi-alert-circle</v-icon>
                <span class="error-text">Person not found</span>
            </v-card-text>
        </v-card>
    </div>
    <v-progress-circular v-else-if="!materializedTrackerFrames" indeterminate :size="80" :width="10"
        class="loading-spinner"></v-progress-circular>

</template>

<script setup lang="ts">

import { useRouter } from 'vue-router';
import { computed, ref, onMounted, watch, nextTick, hasInjectionContext } from "vue";
import { Network, Edge, Node, IdType } from 'vis-network';
import '../styles/main.css';

import { fetchMaterializedFrames } from "@/core/api/api";
import { ChainNode, MaterializedTrackerFrame, RecordValuesDiag, TrackerInformation } from "@/types/api/api";
import { getEdgeColor, getNodeColor } from '@/core/utils';
import TopBar from '@/components/TopBars/TopBar.vue';
import { useErrorMessagesStore } from '@/core/stores/errorMessages';
import { useTrackedYearsStore } from '@/core/stores/trackedYears';
import { FrameRecordIdx, NodePosition, TrackinChainProps } from '../types';
import { useTrackedFeaturesStore } from '@/core/stores/trackedFeatures';

const OFFSET_X = 150
const OFFSET_Y = 100

const router = useRouter();

const trackedYearsStore = useTrackedYearsStore()
const trackedFeaturesStore = useTrackedFeaturesStore()
const errorMessageStore = useErrorMessagesStore()

/* Reactive References */
const network = ref<Network>(null);
const container = ref<HTMLElement | null>(null);
const materializedTrackerFrames = ref<MaterializedTrackerFrame[] | null>(null)

const selectedNodeID = ref<string | null>(null)
const error = ref(false)
const nodes = ref<Node[]>(null)
const edges = ref<Edge[]>(null)


/* Computed Properties */
const networkStyle = computed(() => {
    return {
        height: selectedFrameRecordIdx.value ? '35vh' : '60vh',
    };
});

// Computed: get the current node’s x/y index from its encoded ID
const selectedNodeIndex = computed<NodePosition | null>(() => {
    if (selectedNodeID.value == null) {
        return null
    }
    return decodeId(selectedNodeID.value)
})

// Computed: Get record diagnostics for the currently selected node
const selectedRecordValuesDiagnostic = computed<RecordValuesDiag | null>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }

    const mFrame = materializedTrackerFrames.value[selectedNodeIndex.value.x]
    return mFrame.records[selectedNodeIndex.value.y]
})

// Computed: Get memory for the currently selected node
const selectedFrameMemory = computed<string[][]>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }
    return materializedTrackerFrames.value[selectedNodeIndex.value.x].memory
})

// Computed: Get frame and record index for the selected node
const selectedFrameRecordIdx = computed<FrameRecordIdx>(() => {
    if (materializedTrackerFrames.value == null || selectedNodeIndex.value === null) {
        return null
    }

    const mFrame = materializedTrackerFrames.value[selectedNodeIndex.value.x]

    return { frameIdx: mFrame.frame_idx, recordIdx: mFrame.records[selectedNodeIndex.value.y].record_idx }

})

/* Props */
const props = defineProps<TrackinChainProps>();

/* Network Options */
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

/* Utility Functions */
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

/* Graph Setup Functions */

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

// Calculate Y positions for nodes in a column (candidate nodes)
function getNodeYPositions(offsetY: number, numNodes: number, hasMatchedYear: boolean): number[] {
    let positions = [];

    if (hasMatchedYear) {
        positions.push(0)
    }


    let step = -offsetY
    for (let i = 0; i < Math.floor(numNodes / 2); i++) {
        positions.push(step)
        step -= offsetY
    }

    step = offsetY
    for (let i = hasMatchedYear ? 1 : 0; i < Math.round(numNodes / 2); i++) {
        positions.push(step)
        step += offsetY
    }

    return positions

}

function setupEdges(mFrames: MaterializedTrackerFrame[]) {
    const newEdges: Edge[] = []
    for (let i = 0; i < mFrames.length - 1; i++) {
        const currentFrame = mFrames[i]
        const nextFrame = mFrames[i + 1]

        if (currentFrame.matching_record_idx == null) {
            continue
        }
        // Case 1: Next frame has no matching record — find the next available match and create edges to it
        // Next frame does not have a record index, create an edge to the next frame with a record index
        if (nextFrame.matching_record_idx == null) {

            const nextValidIdx = mFrames.findIndex((frame, index) => frame.matching_record_idx != null && index > i)

            if (nextValidIdx >= 0) {
                const fallbackFrame = mFrames[nextValidIdx]

                fallbackFrame.records.forEach((record, r) => {
                    const recordDiagnostic = record.record_diagnostics;
                    if (!recordDiagnostic) return;

                    newEdges.push(buildEdge(
                        encodeId(i, 0),
                        encodeId(nextValidIdx, r),
                        getEdgeColor(recordDiagnostic.record_score),
                        `${Math.round(recordDiagnostic.record_score * 100) / 100}`,
                        r !== 0
                    ));
                });
            }
        }
        // Case 2: Normal progression to next frame
        // Create edges to next frame's records
        const hasMatchedYear = nextFrame.matching_record_idx != null;
        nextFrame.records.forEach((record, r) => {
            const recordDiagnostic = record.record_diagnostics;
            if (!recordDiagnostic) return;

            newEdges.push(buildEdge(
                encodeId(i, 0),
                encodeId(i + 1, r),
                getEdgeColor(recordDiagnostic.record_score),
                `${Math.round(recordDiagnostic.record_score * 100) / 100}`,
                r !== 0 || !hasMatchedYear
            ));
        });

    }
    edges.value = newEdges
}

// Initialize all nodes
function setupNodes(mFrames: MaterializedTrackerFrame[]) {
    const newNodes: Node[] = []
    let centerX = 0

    if (mFrames.length == 0) {
        return
    }

    for (let i = 0; i < mFrames.length; i++) {
        centerX += OFFSET_X

        const frame = mFrames[i]
        const year = trackedYearsStore.getYearFromFrameIdx(frame.frame_idx)
        const hasMatchedYear = frame.matching_record_idx != null
        const records = frame.records

        const positions = getNodeYPositions(OFFSET_Y, records.length, hasMatchedYear)

        for (let r = 0; r < records.length; r++) {
            newNodes.push(buildNode(
                encodeId(i, r), year,
                i * OFFSET_X, positions[r],
                r == 0 && hasMatchedYear))
        }


    }

    nodes.value = newNodes
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
    // Click to zoom/select
    network.value.on("click", function (params) {
        if (params.nodes.length > 0) {
            selectedNodeID.value = params.nodes[0];
            zoomTo(selectedNodeID.value)
        }
    });
}


/* Navigation Functions */
function changeNode(offsetX: number, offsetY: number) {

    if (selectedNodeID.value == null) {
        selectedNodeID.value = encodeId(0, 0)
    } else {
        const decoded = decodeId(selectedNodeID.value)
        const x = (decoded.x + offsetX + materializedTrackerFrames.value.length) % materializedTrackerFrames.value.length
        const records = materializedTrackerFrames.value[x].records
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

function resetZoom() {
    nextTick(() => {
        network.value?.fit({
            animation: { duration: 500, easingFunction: "easeInOutQuad" },
        });
    })
    selectedNodeID.value = null

};

watch(materializedTrackerFrames, newMaterializedTrackerFrames => {
    if (newMaterializedTrackerFrames === null) {
        return
    }

    if (network.value) {
        network.value.destroy();
        network.value = null;
    }

    setupNodes(newMaterializedTrackerFrames)
    setupEdges(newMaterializedTrackerFrames)
    nextTick(() => setupNetwork())
})

onMounted(async () => {
    try {
        await trackedYearsStore.fetchAndStoreTrackedYears()
        await trackedFeaturesStore.fetchAndStoreTrackedFeatures()
        const f = await fetchMaterializedFrames(props.trackerID)

        if (f.frames) {
            materializedTrackerFrames.value = f.frames
        } else {
            errorMessageStore.addErrorMessage("Person not found")
            error.value = true
        }
    } catch (error) {
        errorMessageStore.handleError(error)
    }

})

</script>

<style lang="scss" scoped>
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
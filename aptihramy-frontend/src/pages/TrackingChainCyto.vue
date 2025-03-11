<template>
    <div>
        <div ref="cyContainer" style="width: 100%; height: 500px;"></div>

        <button @click="resetZoom">Reset Zoom</button>
        <button @click="nextNode">Next</button>
        <button @click="previousNode">Previous</button>

        <v-row class="test">
            <v-col v-if="selectedNodeId !== null" cols="5">
                <OneFrameInformation :frame-index="selectedNodeId" :tracked-person-index="trackedPersonIndex"
                    :columns="2">
                </OneFrameInformation>
            </v-col>


            <v-col :cols="selectedNodeId === null ? 12 : 6" id="mynetwork"> </v-col>
            <v-col cols="1">
                <button v-if="selectedNodeId !== null" @click="nextNode">Next</button>
                <button v-if="selectedNodeId !== null" @click="previousNode">Previous</button>
                <v-fab icon="$vuetify" location="bottom center"></v-fab>
            </v-col>

        </v-row>

    </div>
</template>

<script setup>
import { Network } from 'vis-network';
import { TEST_DATA } from '@/config/test_data';
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from 'vue-router';
import '../styles/theme.css'
import cytoscape from "cytoscape";

const props = defineProps({
    trackedPersonIndex: Number
})
const cyContainer = ref(null);
const route = useRoute();
const network = ref(null);
const container = ref(null);

const selectedNodeId = ref(null)

const trackedPersonIndex = computed(() => Number(route.params.trackedPersonIndex));
const personToDisplay = computed(() => TEST_DATA[trackedPersonIndex.value]);


const el = computed(() => {
    const ret = []
    if (personToDisplay.value) {
        personToDisplay.value.forEach((a, i) => ret.push({ data: { id: i } }))
        personToDisplay.value.slice(0, -1).forEach((_, i) => (ret.push({
            data: {
                source: i,
                target: i + 1
            }
        })));
    }

    return ret
}
)



function nextNode() {
    selectedNodeId.value = selectedNodeId.value === null ? 0 : selectedNodeId.value
    selectedNodeId.value = (selectedNodeId.value + 1 + personToDisplay.length) % personToDisplay.length
    zoomTo(selectedNodeId.value)
}

function previousNode() {
    selectedNodeId.value = selectedNodeId.value === null ? 0 : selectedNodeId.value
    selectedNodeId.value = (selectedNodeId.value - 1 + personToDisplay.length) % personToDisplay.length
    zoomTo(selectedNodeId.value)
}

onMounted(() => {

    container.value = document.getElementById("mynetwork");

    if (!container.value) {
        return
    }

    cytoscape({
        container: cyContainer.value,
        elements: el.value,
        style: [
            { selector: 'node', style: { 'background-color': '#007bff', label: 'data(id)' } },
            { selector: 'edge', style: { width: 2, 'line-color': '#999' } }
        ],
        layout: { name: 'grid' }
    });

});


function zoomTo(nodeId) {
    network.value?.focus(nodeId, {
        scale: 5, // Zoom in
        animation: { duration: 400, easingFunction: "easeInOutQuad" },
    });
    //network.redraw()
}



// Reset zoom function
function resetZoom() {
    network.value?.fit({
        animation: { duration: 500, easingFunction: "easeInOutQuad" },
    });
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
    height: 90vh;
}

.test {
    justify-content: bottom;
    align-items: center;
}

button {
    margin: 10px;
    padding: 8px 12px;
    font-size: 16px;
    background-color: "primary";
    color: "surface";
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

button:hover {
    background-color: "secondary";
}
</style>

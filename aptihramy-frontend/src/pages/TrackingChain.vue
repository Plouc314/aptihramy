<template>
    {{ edges }}
    <h1>User Profile</h1>
    <p>User ID: {{ personToDisplay }}</p>
    <div id="app">
        <div id="mynetwork"></div>
    </div>
</template>

<script setup>
import { Network } from 'vis-network';
import { TEST_DATA } from '@/config/test_data';
import { computed, ref, onMounted, onUnmounted, } from "vue";

const network = ref(null);
const container = ref(null);


const personToDisplay = TEST_DATA[props.trackedPersonIndex]
const nodes = ref(personToDisplay.map(value => {
    return { id: value.annee, label: value.annee, shape: "circle", color: "#ff5733", size: 30 }
}))

const edges = computed(() => {
    let ret = []
    for (let i = 0; i < personToDisplay.length; i++) {
        if (i < personToDisplay.length - 1) {
            const edge = { from: personToDisplay[i].annee, to: personToDisplay[i + 1].annee, color: "#ff0000", width: 2, arrows: "to" }
            ret.push(edge)
        }
    }
    return ret
})

const options = ref({
    interaction: {
        hover: true,
    },
    physics: {
        enabled: false, // Disable physics for fixed positions
    },
});

const graph_data = computed(() => ({
    nodes: nodes.value,
    edges: edges.value,
}));


onMounted(() => {
    container.value = document.getElementById("mynetwork");

    if (container.value) {
        network.value = new Network(
            container.value,
            graph_data.value,
            options.value
        );

        // Add interactions
        network.value.on("click", function (params) {
            if (params.edges.length > 0) {
                alert(`You clicked on Edge ${params.edges[0]}`);
            } else if (params.nodes.length > 0) {
                alert(`You clicked on Node ${params.nodes[0]}`);
            }
        });

        network.value.on("hoverNode", function (params) {
            const nodeId = params.node;
            console.log("oui")
            // nodes.value = nodes.value.map(node =>
            //     node.id === nodeId ? { ...node, color: "#FFD700" } : node
            // );
        });

        // network.value.on("blurNode", function (params) {
        //     const nodeId = params.node;
        //     nodes.value = nodes.value.map(node =>
        //         node.id === nodeId ? { ...node, color: node.originalColor } : node
        //     );
        // });

        network.value.on("hoverEdge", function (params) {
            console.log("Hovering over edge:", params.edge);
        });

        network.value.on("blurEdge", function (params) {
            console.log("Stopped hovering over edge:", params.edge);
        });
    }
});


onUnmounted(() => {
    if (network.value) {
        network.value.destroy();
        network.value = null;
    }
});



</script>

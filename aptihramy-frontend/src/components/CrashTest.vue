<template>
    <div id="app">
        <div id="mynetwork"></div>
    </div>
</template>



<script setup>
import { Network } from 'vis-network';
import { ref, onMounted, onUnmounted, computed } from 'vue';

const network = ref(null);
const container = ref(null);


const nodes = ref([
    { id: "Node 1", label: "Node 1", shape: "circle", color: "#ff5733", size: 30 },
    { id: "Node 2", label: "Node 2", shape: "box", color: "#33ff57", size: 25 },
    { id: "Node 3", label: "Node 3", shape: "ellipse", color: "#3357ff", size: 20 },
    { id: "Node 4", label: "Node 4", shape: "diamond", color: "#f0ad4e", size: 35 },
]);

const edges = ref([
    { from: "Node 1", to: "Node 2", color: "#ff0000", width: 2, arrows: "to" },
    { from: "Node 2", to: "Node 3", color: "#00ff00", width: 3, dashes: true },
    { from: "Node 3", to: "Node 4", color: "#0000ff", width: 2, arrows: "to, from" },
]);

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

<style>
#mynetwork {
    width: 100%;
    height: 620px;

}
</style>

<template>

    <div id="app">

        <div id="mynetwork"></div>

    </div>
</template>

<style>
#mynetwork {
    width: 100%;
    height: 620px;
    margin: 5px 0;
    border: 1px solid #000;
}
</style>

<script>
import { Network } from 'vis-network';

export default {
    name: "GrafosMy",
    data() {
        return {
            nodes: [
                { id: 1, label: "Node 1" },
                { id: 2, label: "Node 2" },
                { id: 3, label: "Node 3" },
                { id: 4, label: "Node 4" },
            ],

            edges: [
                { from: 1, to: 3 },
                { from: 1, to: 2 },
                { from: 2, to: 4 },
            ],
            options: {
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                },
                nodes: {
                    physics: true,
                },
            },
            container: "",
            network: null,
        };
    },

    computed: {
        graph_data() {
            return {
                nodes: this.nodes,
                edges: this.edges,
            };
        },
    },

    mounted() {
        this.container = document.getElementById("mynetwork");

        this.network = new Network(
            this.container,
            this.graph_data,
            this.options
        );
    },
};


</script>
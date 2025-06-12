<template>
    <v-app-bar>
        <template v-if="props.goBackBtn" v-slot:prepend>
            <v-icon @click="goBack">mdi mdi-arrow-left</v-icon>
        </template>

        <v-app-bar-title class="top-bar-title">{{ props.title }}</v-app-bar-title>

        <slot></slot>

        <template v-slot:append>
            <TopBarMenu></TopBarMenu>
        </template>
    </v-app-bar>

</template>

<script setup lang="ts">
import { TopBarEditPageProps, TopBarProps } from "../../types";
import "../../styles/theme.css"
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<TopBarProps>();

function goBack() {
    router.back()
}

</script>

<style scoped>
.top-bar-title {
    color: var(--primary);

}
</style>
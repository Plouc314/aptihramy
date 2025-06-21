<template>
  <v-app>
    <v-snackbar-queue v-model="errorMessageStore.queue"> </v-snackbar-queue>
    <v-main class="fill-height">
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>

import { useErrorMessagesStore } from './core/stores/errorMessages';


const errorMessageStore = useErrorMessagesStore()

</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>

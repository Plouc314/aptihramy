<template>
  <v-app>
    <Snackbar></Snackbar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { trackedFeaturesStore } from './core/stores/trackedFeatures';
import Snackbar from './components/Snackbar.vue'

const tfStore = trackedFeaturesStore()
tfStore.fetchTrackedFeatures()

</script>

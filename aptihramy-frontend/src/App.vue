<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { trackedFeaturesStore } from './core/stores/trackedFeatures';

const tfStore = trackedFeaturesStore()
tfStore.fetchTrackedFeatures()

</script>

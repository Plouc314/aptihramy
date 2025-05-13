<template>
  <v-app>
    <Snackbar></Snackbar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { trackedFeaturesStore } from './core/stores/trackedFeatures';
import { trackedYearsStore } from './core/stores/trackedYears';

import Snackbar from './components/Snackbar.vue'

const tfStore = trackedFeaturesStore()
tfStore.fetchTrackedFeatures()
const tyStore = trackedYearsStore()
tyStore.fetchTrackedYears()

</script>

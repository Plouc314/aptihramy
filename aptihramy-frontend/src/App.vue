<template>
  <v-app>
    <v-snackbar-queue v-model="errorMessageStore.queue"> </v-snackbar-queue>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { trackedFeaturesStore } from './core/stores/trackedFeatures';
import { trackedYearsStore } from './core/stores/trackedYears';
import { useErrorMessagesStore } from './core/stores/errorMessages';
import { removeToken } from './core/auth';

const errorMessageStore = useErrorMessagesStore()
//removeToken()

</script>

<template>
  <v-app>
    <v-snackbar-queue v-model="errorMessageStore.queue"> </v-snackbar-queue>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import TopBar from './components/TopBars/TopBarHomePage.vue';
import { useErrorMessagesStore } from './core/stores/errorMessages';

const errorMessageStore = useErrorMessagesStore()
//removeToken()

</script>

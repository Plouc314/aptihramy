<template>
    <v-card class="card">
        <v-row justify="space-between" no-gutters>
            <!-- Title aligned to the left -->
            <v-col cols="auto">
                <v-card-title class="title-text">{{ title }}</v-card-title>
            </v-col>

            <!-- Button aligned to the right -->
            <v-col cols="auto" class="text-center">
                <v-btn class="ok-btn" @click="showPage" prepend-icon="mdi-book-open-page-variant">Show Page</v-btn>
            </v-col>
        </v-row>
        <v-divider :thickness="3" color="info"></v-divider>

        <div class="content">
            <v-card-item>
                <v-row>
                    <v-col v-for="([prettyFeature, value], index) in frameInformation" :key="index"
                        :cols="12 / props.nbColumns" class="data-col">
                        <span class="data-title">{{ prettyFeature }}</span>
                        <span class="data-value">{{ value }}</span>
                    </v-col>
                </v-row>
            </v-card-item>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { OneFrameInformationProps } from '../types/types';
import '../styles/theme.css';
import '../styles/button.css';
import { fetchRecordValues } from '@/core/api';
import { useSnackbarQueue } from '@/core/snackbarQueue';
import { trackedFeaturesStore } from '../core/stores/trackedFeatures';
import { trackedYearsStore } from "@/core/stores/trackedYears";
import { TrackerDiagnostics, TrackerRecordDiagnostics } from "@/types/api_types";


const props = defineProps<OneFrameInformationProps>();
const trackerDiagnostics = ref<TrackerDiagnostics | null>(null);
const recordDiag = computed<TrackerRecordDiagnostics | null>(() => {
    if(props.diagnostic == null){
        return null
    }

    return props.diagnostic.records.find(r => r.record_idx == props.recordIdx)
})
const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const error = ref(false)
const records = ref<Map<string, (string | number)[]>>(null)
const tfStore = trackedFeaturesStore()
const tyStore = trackedYearsStore()

const title = computed(() => {
    if (records.value == null) {
        return ""
    }
    if (tfStore.getTrackedFeatures.raw_features.includes("chef_prenom_norm") && tfStore.getTrackedFeatures.raw_features.includes("chef_nom_norm")) {
        return `${records.value["chef_prenom_norm"]} ${records.value["chef_nom_norm"]}`
    }
    return ""
})

function showPage() {
    console.log("TO BE IMPLEMENTED")
}

function updateValues() {
    fetchRecordValues(props.frameIdx, props.recordIdx).then(data => {
        if (data.records) {
            records.value = data.records
        } else {
            addSnackbar("Person not found", snackbarTypes.ERROR)
            error.value = true
        }
    }
    )
}


watch(() => [props.frameIdx, props.recordIdx], _ => {
    updateValues()
})

const frameInformation = computed(() => {
    const a = new Map<string, string | number>()
    if (!records.value) {
        return a
    }
    for (const rawFeature in records.value) {
        const values = records.value[rawFeature]
        if (values.length > 0) {
            a.set(tfStore.getPrettyFromRaw(rawFeature), values[0])
        } else {
            a.set(tfStore.getPrettyFromRaw(rawFeature), "")
        }
    }
    a.set("Annee", tyStore.getYearFromFrameIdx(props.frameIdx))
    a.set("Index dans le fichier", props.recordIdx + 2)
    return a

})

onMounted(() => {
    updateValues()

})
</script>



<style>
.card {
    display: flex;
    flex-direction: column;
    max-height: 50vh;
    border-radius: 12px;
    background-color: var(--background);
    color: var(--text-primary);
    box-shadow: 0px 4px 10px var(--box-shadow);
}

.title-text {
    font-size: 20px;
    font-weight: bold;
    text-align: left;
    color: var(--primary);
    text-transform: uppercase;
}


.content {
    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 10px;
    max-height: 35vh;

}

.data-col {
    display: flex;
    flex-direction: column;
    padding: 8px 25px;
    border-bottom: 1px solid var(--box-shadow);

    &:last-child {
        border-bottom: none;
        margin-bottom: 1px;
    }
}

.data-value {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 16px;
}

.data-title {
    font-weight: bold;
    color: var(--text-secondary);
    font-size: 14px;
    text-transform: uppercase;

}
</style>

import { defineStore } from 'pinia'
import { getTrackedFeatures } from '@/core/api';
import { TrackedFeatures } from '@/types/api_types';



export const trackedFeaturesStore = defineStore('trackedFeaturesStore', {
    state: () => ({ trackedFeatures: null as TrackedFeatures | null }),
    getters: {
        getTrackedFeatures: (state) => state.trackedFeatures,
    },
    actions: {
        fetchTrackedFeatures() {
            getTrackedFeatures()
                .then((data) => {
                    this.trackedFeatures = data;
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }
})


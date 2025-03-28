import { defineStore } from 'pinia'
import { fetchTrackedFeatures } from '@/core/api';
import { TrackedFeatures } from '@/types/api_types';



export const trackedFeaturesStore = defineStore('trackedFeaturesStore', {
    state: () => ({ trackedFeatures: null as TrackedFeatures | null }),
    getters: {
        getTrackedFeatures: (state) => state.trackedFeatures,
        getTrackedFeatureIndex: (state) => {
            return (pretty_feature: string) => {
                if (state.trackedFeatures)
                    return state.trackedFeatures.pretty_features.findIndex(_ => _ == pretty_feature)
                return -1
            }

        },
    },
    actions: {
        fetchTrackedFeatures() {
            fetchTrackedFeatures()
                .then((data) => {
                    this.trackedFeatures = data;
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }
})


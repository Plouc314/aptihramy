import { defineStore } from 'pinia'
import { fetchTrackedFeatures } from '@/core/api';
import { TrackedFeatures } from '@/types/api_types';

export const trackedFeaturesStore = defineStore('trackedFeaturesStore', {
    state: () => ({ trackedFeatures: null as TrackedFeatures | null }),

    getters: {
        getTrackedFeatures: (state) => state.trackedFeatures,

        getTrackedFeatureIndex: (state) => {
            return (feature: string, prettyFeature: boolean = true) => {
                if (!state.trackedFeatures) return -1;

                let features = prettyFeature
                    ? state.trackedFeatures.pretty_features
                    : state.trackedFeatures.raw_features;

                return features.findIndex((f) => f === feature);
            };
        },

        getRawFromPretty: (state) => {
            return (prettyFeature: string) => {
                const index = trackedFeaturesStore().getTrackedFeatureIndex(prettyFeature);
                return index !== -1 ? state.trackedFeatures?.raw_features[index] : null;
            };
        },

        getPrettyFromRaw: (state) => {
            return (rawFeature: string) => {
                const index = trackedFeaturesStore().getTrackedFeatureIndex(rawFeature, false); 
                return index !== -1 ? state.trackedFeatures?.pretty_features[index] : null;
            };
        }
    },

    actions: {
        fetchTrackedFeatures() {
            fetchTrackedFeatures()
                .then((data) => {
                    this.trackedFeatures = data;
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }
});

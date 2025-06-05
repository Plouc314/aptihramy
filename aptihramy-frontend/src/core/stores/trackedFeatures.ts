import { defineStore } from 'pinia'
import { fetchTrackedFeatures, UNAUTHORIZED } from '@/core/api';
import { TrackedFeatures } from '@/types/api_types';
import { useRouter } from 'vue-router';
import { useErrorMessagesStore } from './errorMessages';

export const trackedFeaturesStore = defineStore('trackedFeaturesStore', {
    state: () => ({ trackedFeatures: null as TrackedFeatures | null }),

    getters: {
        getTrackedFeatures: (state) => state.trackedFeatures,

        getTrackedFeatureIndex: (state) => {
            return (feature: string, prettyFeature: boolean = true): number => {
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
        },

        getTrackedFeature: (state) => {
            return (index: number, prettyFeature: boolean = true): string | null => {
                if (!state.trackedFeatures) return null;

                if (!(0 <= index && index < state.trackedFeatures.pretty_features.length)) {
                    return null
                }

                if (prettyFeature) {
                    return state.trackedFeatures.pretty_features[index]

                }
                return state.trackedFeatures?.raw_features[index]

            }
        }
    },

    actions: {
        fetchTrackedFeatures() {
            fetchTrackedFeatures()
                .then((data) => {
                    this.trackedFeatures = data;
                })
                .catch((err) => {
                    if (err.message == UNAUTHORIZED) {
                        const router = useRouter()
                        router.push({ name: 'LoginPage' });

                    } else {
                        const errorMessageStore = useErrorMessagesStore()
                        errorMessageStore.addErrorMessage(`An error occurred: ${err}`)
                    }
                    console.error(err);
                });
        }
    }
});
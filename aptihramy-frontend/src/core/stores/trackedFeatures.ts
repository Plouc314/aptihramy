// stores/trackedFeaturesStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchMaterializedFrames, fetchMultiStringsFeatures, fetchTrackedFeatures } from '@/core/api'
import { TrackedFeatures } from '@/types/api/api'
import { useErrorMessagesStore } from './errorMessages'

export const useTrackedFeaturesStore = defineStore('trackedFeaturesStore', () => {
    const trackedFeatures = ref<TrackedFeatures | null>(null)
    const errorStore = useErrorMessagesStore()
    const multistringsFeatures = ref<string[]>([])
    // ✅ Getters (as computed)
    const getTrackedFeatures = computed(() => trackedFeatures.value)

    function getTrackedFeatureIndex(feature: string, prettyFeature = true): number {
        if (!trackedFeatures.value) return -1
        const features = prettyFeature
            ? trackedFeatures.value.pretty_features
            : trackedFeatures.value.raw_features
        return features.findIndex((f) => f === feature)
    }

    function getRawFromPretty(prettyFeature: string): string | null {
        const index = getTrackedFeatureIndex(prettyFeature, true)
        return index !== -1 ? trackedFeatures.value?.raw_features[index] ?? null : null
    }

    function getPrettyFromRaw(rawFeature: string): string | null {
        const index = getTrackedFeatureIndex(rawFeature, false)
        return index !== -1 ? trackedFeatures.value?.pretty_features[index] ?? null : null
    }

    function isFeatureMultiString(feature: string, prettyFeature = true): boolean {
        const rawFeature = prettyFeature ? getRawFromPretty(feature) : feature
        return multistringsFeatures.value.includes(rawFeature)
    }

    const getTrackedFeature = (index: number, prettyFeature = true): string | null => {
        if (!trackedFeatures.value) return null

        const list = prettyFeature
            ? trackedFeatures.value.pretty_features
            : trackedFeatures.value.raw_features

        if (index < 0 || index >= list.length) return null
        return list[index]
    }

    // ✅ Actions
    async function fetchAndStoreTrackedFeatures() {
        try {
            const tf = await fetchTrackedFeatures()
            trackedFeatures.value = await fetchTrackedFeatures()
            const mf = await fetchMultiStringsFeatures()
            multistringsFeatures.value = mf.multistrings_features
        } catch (err) {
            errorStore.handleError(err)
            console.error(err)
        }
    }

    return {
        // state
        trackedFeatures,

        // getters
        getTrackedFeatures,
        getTrackedFeatureIndex,
        getRawFromPretty,
        getPrettyFromRaw,
        getTrackedFeature,

        // actions
        fetchAndStoreTrackedFeatures,
        isFeatureMultiString
    }
})

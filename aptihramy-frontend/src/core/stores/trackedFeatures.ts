// stores/trackedFeaturesStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchTrackedFeatures } from '@/core/api'
import { TrackedFeatures } from '@/types/api'
import { useErrorMessagesStore } from './errorMessages'

export const useTrackedFeaturesStore = defineStore('trackedFeaturesStore', () => {
    const trackedFeatures = ref<TrackedFeatures | null>(null)
    const errorStore = useErrorMessagesStore()

    // ✅ Getters (as computed)
    const getTrackedFeatures = computed(() => trackedFeatures.value)

    const getTrackedFeatureIndex = (feature: string, prettyFeature = true): number => {
        if (!trackedFeatures.value) return -1
        const features = prettyFeature
            ? trackedFeatures.value.pretty_features
            : trackedFeatures.value.raw_features
        return features.findIndex((f) => f === feature)
    }

    const getRawFromPretty = (prettyFeature: string): string | null => {
        const index = getTrackedFeatureIndex(prettyFeature, true)
        return index !== -1 ? trackedFeatures.value?.raw_features[index] ?? null : null
    }

    const getPrettyFromRaw = (rawFeature: string): string | null => {
        const index = getTrackedFeatureIndex(rawFeature, false)
        return index !== -1 ? trackedFeatures.value?.pretty_features[index] ?? null : null
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
            const data = await fetchTrackedFeatures()
            trackedFeatures.value = data
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
        fetchAndStoreTrackedFeatures
    }
})

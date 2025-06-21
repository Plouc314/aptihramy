// stores/trackedFeaturesStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchMaterializedFrames, fetchMultiStringsFeatures, fetchTrackedFeatures } from '@/core/api/api'
import { TrackedFeatures } from '@/types/api/api'
import { useErrorMessagesStore } from './errorMessages'

export const useTrackedFeaturesStore = defineStore('trackedFeaturesStore', () => {
    // Reactive state for the tracked features data
    const trackedFeatures = ref<TrackedFeatures | null>(null)
    const errorStore = useErrorMessagesStore()
    // Reactive list of feature names that are multi-strings
    const multistringsFeatures = ref<string[]>([])

    // Computed getter for the current tracked features
    const getTrackedFeatures = computed(() => trackedFeatures.value)

    // Separator used for multi-string features (default is pipe "|")
    const getMultistringsSeparator = ref<string>("|")

    /**
     * Get the index of a feature in either the pretty or raw feature list
     * @param feature - The feature name to search for
     * @param prettyFeature - Whether to search in the pretty or raw feature list
     * @returns Index of the feature, or -1 if not found
     */
    function getTrackedFeatureIndex(feature: string, prettyFeature = true): number {
        if (!trackedFeatures.value) return -1
        const features = prettyFeature
            ? trackedFeatures.value.pretty_features
            : trackedFeatures.value.raw_features
        return features.findIndex((f) => f === feature)
    }

    /**
     * Converts a pretty feature name to its corresponding raw name
     * @param prettyFeature - Human-readable feature name
     * @returns Corresponding raw feature name or null if not found
     */
    function getRawFromPretty(prettyFeature: string): string | null {
        const index = getTrackedFeatureIndex(prettyFeature, true)
        return index !== -1 ? trackedFeatures.value?.raw_features[index] ?? null : null
    }

    /**
     * Converts a raw feature name to its corresponding pretty name
     * @param rawFeature - Internal/raw feature name
     * @returns Corresponding pretty feature name or null if not found
     */
    function getPrettyFromRaw(rawFeature: string): string | null {
        const index = getTrackedFeatureIndex(rawFeature, false)
        return index !== -1 ? trackedFeatures.value?.pretty_features[index] ?? null : null
    }

    /**
     * Checks whether a given feature is a multi-string feature
     * @param feature - Feature to check
     * @param prettyFeature - Whether the input is a pretty or raw name
     * @returns True if the feature is multi-string, false otherwise
     */
    function isFeatureMultiString(feature: string, prettyFeature = true): boolean {
        const rawFeature = prettyFeature ? getRawFromPretty(feature) : feature
        return multistringsFeatures.value.includes(rawFeature)
    }

    /**
     * Returns the feature name at the given index
     * @param index - Index in the feature list
     * @param prettyFeature - Whether to return pretty or raw feature
     * @returns Feature name or null if index is out of bounds
     */
    const getTrackedFeature = (index: number, prettyFeature = true): string | null => {
        if (!trackedFeatures.value) return null

        const list = prettyFeature
            ? trackedFeatures.value.pretty_features
            : trackedFeatures.value.raw_features

        if (index < 0 || index >= list.length) return null
        return list[index]
    }


    /**
     * Fetch tracked features and multi-string features from the API
     * Stores them in local state, handles errors gracefully
     */
    async function fetchAndStoreTrackedFeatures() {
        try {
            trackedFeatures.value = await fetchTrackedFeatures()
            const mf = await fetchMultiStringsFeatures()
            multistringsFeatures.value = mf.multistrings_features
        } catch (err) {
            errorStore.handleError(err)
        }
    }

    return {
        trackedFeatures,

        getTrackedFeatures,
        getTrackedFeatureIndex,
        getRawFromPretty,
        getPrettyFromRaw,
        getTrackedFeature,
        getMultistringsSeparator,


        fetchAndStoreTrackedFeatures,
        isFeatureMultiString
    }
})

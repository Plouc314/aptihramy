// stores/trackedYearsStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchTrackedYears } from '@/core/api'
import { useErrorMessagesStore } from './errorMessages'

export const useTrackedYearsStore = defineStore('trackedYearsStore', () => {
    const trackedYears = ref<number[] | null>(null)
    const errorStore = useErrorMessagesStore()

    // ✅ Getters
    const getTrackedYears = computed(() => trackedYears.value)

    const getYearFromFrameIdx = (frameIdx: number): number => {
        if (!trackedYears.value) return -1
        if (frameIdx >= 0 && frameIdx < trackedYears.value.length) {
            return trackedYears.value[frameIdx]
        }
        return -1
    }

    // ✅ Action
    async function fetchAndStoreTrackedYears() {
        try {
            const data = await fetchTrackedYears()
            if (data.tracked_years) {
                trackedYears.value = data.tracked_years
            }
        } catch (err) {
            errorStore.handleError(err)
        }
    }

    return {
        // State
        trackedYears,

        // Getters
        getTrackedYears,
        getYearFromFrameIdx,

        // Actions
        fetchAndStoreTrackedYears
    }
})

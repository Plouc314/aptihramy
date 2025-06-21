// stores/trackedYearsStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchTrackedYears } from '@/core/api/api'
import { useErrorMessagesStore } from './errorMessages'

export const useTrackedYearsStore = defineStore('trackedYearsStore', () => {
    const trackedYears = ref<number[] | null>(null)
    const errorStore = useErrorMessagesStore()


    const getTrackedYears = computed(() => trackedYears.value)

    function getYearFromFrameIdx(frameIdx: number): number {
        if (!trackedYears.value) return -1
        if (frameIdx >= 0 && frameIdx < trackedYears.value.length) {
            return trackedYears.value[frameIdx]
        }
        return -1
    }

    /**
    * Returns the year associated with a given frame index.
    * @param frameIdx - The index to look up (e.g. 0 for the first year)
    * @returns Corresponding year or -1 if invalid
    */
    function getFrameIdxFromYear(year: number): number {
        return trackedYears.value?.findIndex(y => y === year) ?? -1;
    }

    /**
     * Fetch tracked years from the API and store them in local state.
     * Handles errors using the error store.
     */
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
        trackedYears,

        getTrackedYears,
        getYearFromFrameIdx,
        getFrameIdxFromYear,

        fetchAndStoreTrackedYears
    }
})

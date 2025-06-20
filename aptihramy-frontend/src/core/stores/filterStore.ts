// stores/filterStore.ts
import { FilterState } from '@/types/components/filter'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useFilterStore = defineStore('filterStore', () => {
    // Reactive array of filters, initialized with one default filter
    const storedFilters = ref<FilterState[]>([{ id: 1, feature: '', input: '' }])
    // Reactive counter to track and generate unique filter IDs
    const id = ref(1)
    // Creates a new empty filter and appends it to storedFilters
    function createEmptyFilter() {
        id.value += 1
        storedFilters.value.push({ id: id.value, feature: '', input: '' })
    }

    /**
      * Finds the index and filter object by its ID
      * @param targetId - ID of the filter to find
      * @returns Tuple of index and the filter object. If not found, returns [-1, empty filter object]
      */
    function findIndexValue(targetId: number): [number, FilterState] {
        for (let i = 0; i < storedFilters.value.length; i++) {
            const value = storedFilters.value[i]
            if (value.id === targetId) {
                return [i, value]
            }
        }
        // Return -1 and an empty default filter if not found
        return [-1, { id: 0, feature: '', input: '' }]
    }

    /**
       * Updates an existing filter or adds it if it doesn't exist
       * @param filter - The filter object to edit or insert
       */

    function editFilter(filter: FilterState) {
        const [index, currentValue] = findIndexValue(filter.id)

        if (index < 0) {
            // If the filter doesn't exist, add it to the list
            storedFilters.value.push(filter)
        } else {
            // If found, update the existing filter while preserving unspecified fields
            storedFilters.value[index] = { ...currentValue, ...filter }
        }
    }

    /**
       * Removes a filter from the list based on its ID
       * @param filter - The filter object to remove
       */
    function removeFilter(filter: FilterState) {
        const filtered = storedFilters.value.filter((f) => f.id !== filter.id)
        storedFilters.value.splice(0)
        storedFilters.value.push(...filtered)
    }

    return {
        storedFilters,
        id,
        createEmptyFilter,
        findIndexValue,
        editFilter,
        removeFilter
    }
})

// stores/filterStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { FilterState } from '@/types/types'

export const useFilterStore = defineStore('filterStore', () => {
    const storedFilters = ref<FilterState[]>([{ id: 1, feature: '', input: '' }])
    const id = ref(1)
    function createEmptyFilter() {
        id.value += 1
        storedFilters.value.push({ id: id.value, feature: '', input: '' })
    }

    function findIndexValue(targetId: number): [number, FilterState] {
        for (let i = 0; i < storedFilters.value.length; i++) {
            const value = storedFilters.value[i]
            if (value.id === targetId) {
                return [i, value]
            }
        }
        return [-1, { id: 0, feature: '', input: '' }]
    }

    function editFilter(filter: FilterState) {
        const [index, currentValue] = findIndexValue(filter.id)

        if (index < 0) {
            storedFilters.value.push(filter)
        } else {
            storedFilters.value[index] = { ...currentValue, ...filter }
        }
    }

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

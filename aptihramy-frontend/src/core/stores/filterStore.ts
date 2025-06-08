// stores/filterStore.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { FilterState } from '@/types/types'

const FILTER_STORAGE_KEY = 'filter-store'
const ID_STORAGE_KEY = 'filter-store-id'

export const useFilterStore = defineStore('filterStore', () => {
    // Load from localStorage or default
    const storedFilters = ref<FilterState[]>(
        JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '[]') || [{ id: 1, feature: '', input: '' }]
    )
    const id = ref<number>(parseInt(localStorage.getItem(ID_STORAGE_KEY) || '1', 10))

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
        storedFilters.value = storedFilters.value.filter((f) => f.id !== filter.id)
    }

    // 🔁 Auto-persist to localStorage
    watch(storedFilters, (val) => {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(val))
    }, { deep: true })

    watch(id, (val) => {
        localStorage.setItem(ID_STORAGE_KEY, val.toString())
    })

    return {
        storedFilters,
        id,
        createEmptyFilter,
        findIndexValue,
        editFilter,
        removeFilter
    }
})

import { defineStore } from 'pinia'
import { fetchTrackedFeatures } from '@/core/api';
import { TrackedFeatures } from '@/types/api_types';
import { FilterState } from '@/types/types';

export const filterStore = defineStore('filterStore', {
    state: () => ({ storedFilters: [{ id: 1, feature: "", input: "" }] as FilterState[], id: 1 }),

    getters: {
        getStoredFilters: (state) => state.storedFilters,
    },

    actions: {
        createEmptyFilter() {
            this.id += 1
            this.storedFilters.push({ id: this.id, feature: "", input: "" })

        },
        findIndexValue(id: number): [number, FilterState] {
            for (let i = 0; i < this.storedFilters.length; i++) {
                let value = this.storedFilters[i]
                if (value.id === id) {
                    return [i, value]
                }
            }
            return [-1, { id: 0, feature: "", input: "" }]
        },
        editFilter(filter: FilterState) {
            let [index, currentValue] = this.findIndexValue(filter.id)

            if (index < 0) {
                this.storedFilters.addFilter(filter)

            } else {
                currentValue.feature = filter.feature
                currentValue.input = filter.input
                this.storedFilters[index] = currentValue
            }

        },
        removeFilter(filter: FilterState) {
            this.storedFilters = this.storedFilters.filter(f => f.id !== filter.id)
        }

    }
});
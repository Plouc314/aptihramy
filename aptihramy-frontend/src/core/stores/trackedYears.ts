import { defineStore } from 'pinia'
import { fetchTrackedYears } from '@/core/api';

export const trackedYearsStore = defineStore('trackedYearsStore', {
    state: () => ({ trackedYears: null as number[] | null }),
    getters: {
        getTrackedYears: (state) => state.trackedYears,
    },
    actions: {
        fetchTrackedYears() {
            fetchTrackedYears()
                .then((data) => {
                    if (data.tracked_years) {
                        this.trackedYears = data.tracked_years;
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    }
});

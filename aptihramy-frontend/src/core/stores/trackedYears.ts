import { defineStore } from 'pinia'
import { fetchTrackedYears, UNAUTHORIZED } from '@/core/api';
import { useRouter } from 'vue-router';
import { useErrorMessagesStore } from './errorMessages';

export const trackedYearsStore = defineStore('trackedYearsStore', {
    state: () => ({ trackedYears: null as number[] | null }),
    getters: {
        getTrackedYears: (state) => state.trackedYears,
        getYearFromFrameIdx: (state) => {
            return (frameIdx: number) => {
                if (!state.trackedYears) {
                    return -1
                }
                if (0 <= frameIdx && frameIdx < state.trackedYears.length) {
                    return state.trackedYears[frameIdx]
                }
                return -1
            }
        }
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
                    useErrorMessagesStore().handleError(err)
                });
        },

    }
});

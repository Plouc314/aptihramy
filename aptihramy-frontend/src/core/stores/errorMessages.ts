import { Snackbar, SNACKBAR_TYPES } from '@/types/snackbar_types';
import { defineStore } from 'pinia'

export const useErrorMessagesStore = defineStore('errorMessageStore', {
    state: () => ({ queue: [] as Snackbar[] }),

    getters: {
        getQueue: (state) => state.queue,
    },

    actions: {
        addInfoMessage(message: string) {
            this.queue.push({ text: message, timeout: 4000, color: SNACKBAR_TYPES.INFO })
        },
        addWarningMessage(message: string) {
            this.queue.push({ text: message, timeout: 4000, color: SNACKBAR_TYPES.WARNING })
        },
        addErrorMessage(message: string) {
            this.queue.push({ text: message, timeout: 4000, color: SNACKBAR_TYPES.ERROR })
        }
    }

});

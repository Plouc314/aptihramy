import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Snackbar, SNACKBAR_TYPES } from '@/types/components/snackbar'
import { UNAUTHORIZED } from '../api'

export const useErrorMessagesStore = defineStore('errorMessageStore', () => {
    const queue = ref<Snackbar[]>([])
    const router = useRouter()

    function handleError(error: any) {
        if (error.message === UNAUTHORIZED) {
            router.push({ name: 'LoginPage' })
        } else {
            addErrorMessage(error)
        }
        console.log(error)
    }

    function addInfoMessage(message: string) {
        queue.value.push({ text: message, timeout: 4000, color: SNACKBAR_TYPES.INFO })
    }

    function addWarningMessage(message: string) {
        queue.value.push({ text: message, timeout: 4000, color: SNACKBAR_TYPES.WARNING })
    }

    function addErrorMessage(message: string) {
        queue.value.push({ text: message, timeout: 4000, color: SNACKBAR_TYPES.ERROR })
    }

    return {
        queue,
        handleError,
        addInfoMessage,
        addWarningMessage,
        addErrorMessage,
    }
})

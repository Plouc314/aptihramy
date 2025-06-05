import { Snackbar } from '@/types/types';
import { ref, computed, watch } from 'vue';

const snackbarQueue = ref<Snackbar[]>([]);
const isSnackbarVisible = ref(false);
const currentSnackbar = computed(() => snackbarQueue.value[0]);

enum snackbarTypes {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
}
// called when the value of isSnackbarVisible changes
// visible is new value of isSnackbarVisible
watch(isSnackbarVisible, (visible) => {

    /*
    Example:
        - addSnackbar is called which puts isSnackbarVisible to true and adds an entry in snackbarQueue
        - addSnackbar is called which puts isSnackbarVisible to true and adds an entry in snackbarQueue
        - watch is called but nothing happens as visible == true
        - watch is again called when the snackbar is closed or after a certain amount of time
        - visible is false and snackbarQueue.value.length == 2
        - the queue is shifted (removes the first element) and snackbarQueue.value.length == 1
        - isSnackbarVisible.value is set to true after 250 
    */
    if (!visible && snackbarQueue.value.length > 0) {
        snackbarQueue.value.shift()
        if (snackbarQueue.value.length > 0) {
            setTimeout(() => isSnackbarVisible.value = true, 250);
        }
    }
});

function addSnackbar(message: string, color = snackbarTypes.INFO): void {
    snackbarQueue.value.push({ message: message, type: color });
    if (!isSnackbarVisible.value) {
        isSnackbarVisible.value = true;
    }
}

export function useSnackbarQueue() {
    return {
        addSnackbar,
        isSnackbarVisible,
        currentSnackbar,
        snackbarTypes,
    };
}

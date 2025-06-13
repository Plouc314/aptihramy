export enum SNACKBAR_TYPES {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
}

export interface Snackbar {
    text: string,
    timeout: number,
    color: SNACKBAR_TYPES
}
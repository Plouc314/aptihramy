import { DiskDataStatus, DiskError } from "@/types/api/update";
import { fetchData } from "./api";

export async function downloadGraphFromServer(): Promise<Blob> {
    return fetchData<Blob>("/api/download/graph", { method: "GET" }, undefined, null, "blob");
}


export async function downloadDataframesFromServer(normalized: boolean): Promise<Blob> {
    return fetchData<Blob>("/api/download/dataframes", { method: "GET" }, { normalized: normalized ? "true" : "false" }, null, "blob");
}

export async function uploadDataframesToServer(file: File, normalized: boolean): Promise<void | DiskError> {

    const formData = new FormData();
    formData.append("file", file);
    return fetchData<void | DiskError>("/api/upload/dataframes", { method: "POST", body: formData }, { normalized: normalized ? "true" : "false" }, null)
};

export async function uploadBeaverFileToServer(file: File): Promise<void | DiskError> {
    const formData = new FormData();
    formData.append("file", file);
    return fetchData<void | DiskError>("/api/upload/graph", { method: "POST", body: formData }, undefined, null)
};

export async function checkDiskDataStatus(): Promise<DiskDataStatus> {
    return fetchData<DiskDataStatus>("/api/disk-data-status", { method: "GET" })
}
import { UpdateBatch } from "@/types/api/update"
import { fetchData } from "./api"

export async function fetchUnacceptedBatches(): Promise<number[]> {
    return fetchData<number[]>("/api/update/unaccepted-batches", { method: "GET" })
}

export async function fetchUpdateBatchById(batch_id: number): Promise<UpdateBatch> {
    return fetchData<UpdateBatch>(`/api/update/batch/${batch_id}`, { method: "GET" })
}

export async function acceptBatch(batch_id: number): Promise<void> {
    return fetchData<void>(`/api/update/batch/${batch_id}/accept`, { method: "POST" })
}

export async function postUpdateBatch(batch: UpdateBatch): Promise<void> {
    return fetchData<void>("/api/update/batch", { method: "POST", body: JSON.stringify(batch) });
}

export async function rejectBatch(batch_id: number): Promise<void> {
    return fetchData<void>(`/api/update/batch/${batch_id}`, { method: "DELETE" })
}
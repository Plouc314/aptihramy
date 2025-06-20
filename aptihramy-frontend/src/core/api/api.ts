import { DiskDataStatus, DiskError, UpdateBatch } from "@/types/api/update";
import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation, TrackedYears, FrameRecordPair, RecordResult, RecordRequest, RecordsResponse, MultiStringsFeatures } from "../../types/api/api"
import { getToken } from "../auth";
import { useErrorMessagesStore } from "../stores/errorMessages";
import { UserInformation } from "@/types";


const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || "";

export const UNAUTHORIZED = "Unauthorized"

export async function fetchData<T>(
    endpoint: string,
    options: RequestInit,
    params?: Record<string, string | number>,
    contentType: string | null = "application/json",
    responseType: "json" | "blob" = "json"
): Promise<T> {
    let url = API_BASE_URL + endpoint;
    const errorMessageStore = useErrorMessagesStore();

    if (params) {
        url += "?" + new URLSearchParams(params as Record<string, string>).toString();
    }

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (contentType !== null) {
        headers["Content-Type"] = contentType;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem("token");
        errorMessageStore.addErrorMessage(`Token expired, redirecting to login page`);
        throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
        let detail = "Unknown error";
        try {
            const errorJson = await response.json();
            detail = errorJson?.detail ?? detail;
        } catch { }
        throw new Error(`${response.status}: ${detail}`);
    }

    if (responseType === "blob") {
        return (await response.blob()) as T;
    }

    if (response.status === 204 || response.headers.get("Content-Length") === "0") {
        return undefined as T;
    }

    const text = await response.text();
    if (!text) {
        return undefined as T;
    }

    return JSON.parse(text) as T;
}


export async function fetchRoot(): Promise<Root> {
    return fetchData<Root>("/api/", { method: "GET" });
}

export async function fetchFilteredTrackers(featureSearchValue: FilterRequest): Promise<FilterResponse> {
    return fetchData<FilterResponse>("/api/filter", { method: "POST", body: JSON.stringify(featureSearchValue) });
}

export async function fetchMultiStringsFeatures(): Promise<MultiStringsFeatures> {
    return fetchData<MultiStringsFeatures>("/api/features/multi-strings", { method: "GET" });

}

export async function fetchTrackedFeatures(): Promise<TrackedFeatures> {
    return fetchData<TrackedFeatures>("/api/features", { method: "GET" });
}

export async function fetchMaterializedFrames(tracker_id: string): Promise<TrackerInformation> {
    return fetchData<TrackerInformation>("/api/materialized_frames", { method: "GET" }, { "tracker_id": tracker_id });
}

export async function fetchPersonValues(frame_idx: number, record_idx: number): Promise<RecordResult> {
    return fetchData<RecordResult>("/api/record", { method: "GET" }, { "frame_idx": frame_idx.toString(), "record_idx": record_idx.toString() });
}

export async function fetchMultiplePersonValues(frame_record_idx: FrameRecordPair[]): Promise<RecordsResponse> {
    const r: RecordRequest = {
        pairs: frame_record_idx
    }
    return fetchData<RecordsResponse>("/api/records", { method: "POST", body: JSON.stringify(r) });
}

export async function fetchTrackedYears(): Promise<TrackedYears> {
    return fetchData<TrackedYears>("/api/tracked_years", { method: "GET" })
}
import { DiskDataStatus, UpdateBatch } from "@/types/update";
import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation, RecordValuesTrackedFeatures, TrackedYears } from "../types/api"
import { getToken } from "./auth";
import { useErrorMessagesStore } from "./stores/errorMessages";


const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || "";

export const UNAUTHORIZED = "Unauthorized"

async function fetchData<T>(
    endpoint: string,
    options: RequestInit,
    params?: Record<string, string | number>
): Promise<T> {
    let url = API_BASE_URL + endpoint;
    const errorMessageStore = useErrorMessagesStore();

    if (params) {
        url += "?" + new URLSearchParams(params as Record<string, string>).toString();
    }

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        localStorage.removeItem("token");
        errorMessageStore.addErrorMessage(`Token expired, redirecting to login page`);
        throw new Error(UNAUTHORIZED)
    }

    if (!response.ok) {
        errorMessageStore.addErrorMessage(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();

}

export async function postUpdateBatch(batch: UpdateBatch): Promise<void> {
    return fetchData<void>("/api/update/batch", { method: "POST", body: JSON.stringify(batch) });
}

export async function checkToken(): Promise<boolean> {
    const url = API_BASE_URL + "/api/check-token";

    const token = getToken();

    if (!token) {
        return false;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return response.ok;
    } catch (error) {
        console.log("Token check failed:", error);
        return false;
    }
}


export async function login(username: string, password: string): Promise<string> {
    let url = API_BASE_URL + "/auth/jwt/login";

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}

export async function checkDiskDataStatus(): Promise<DiskDataStatus> {
    return fetchData<DiskDataStatus>("/api/disk-data-status", { method: "GET" })
}
export async function fetchRoot(): Promise<Root> {
    return fetchData<Root>("/api/", { method: "GET" });
}

export async function fetchFilteredTrackers(featureSearchValue: FilterRequest): Promise<FilterResponse> {
    return fetchData<FilterResponse>("/api/filter", { method: "POST", body: JSON.stringify(featureSearchValue) });
}

export async function fetchTrackedFeatures(): Promise<TrackedFeatures> {
    return fetchData<TrackedFeatures>("/api/features", { method: "GET" });
}

export async function fetchMaterializedFrames(tracker_id: string): Promise<TrackerInformation> {
    return fetchData<TrackerInformation>("/api/materialized_frames", { method: "GET" }, { "tracker_id": tracker_id });
}

export async function fetchPersonValues(frame_idx: number, record_idx: number): Promise<RecordValuesTrackedFeatures> {
    return fetchData<RecordValuesTrackedFeatures>("/api/record", { method: "GET" }, { "frame_idx": frame_idx.toString(), "record_idx": record_idx.toString() });
}

export async function fetchTrackedYears(): Promise<TrackedYears> {
    return fetchData<TrackedYears>("/api/tracked_years", { method: "GET" })
}
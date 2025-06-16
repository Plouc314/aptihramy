import { DiskDataStatus, DiskError, UpdateBatch } from "@/types/api/update";
import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation, TrackedYears, FrameRecordPair, RecordResult, RecordRequest, RecordsResponse, MultiStringsFeatures } from "../types/api/api"
import { getToken } from "./auth";
import { useErrorMessagesStore } from "./stores/errorMessages";
import { UserInformation } from "@/types";


const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || "";

export const UNAUTHORIZED = "Unauthorized"

async function fetchData<T>(
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
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
    }



    if (responseType === "blob") {
        return (await response.blob()) as T;
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

export async function addUser(email: string, password: string, is_superuser: boolean): Promise<UserInformation> {
    const body = JSON.stringify({
        email,
        password,
        is_superuser,
    });

    return fetchData<UserInformation>("/auth/jwt/register", {
        method: "POST",
        body,
    });
}


export async function fetchCurrentUserInformation(): Promise<UserInformation> {
    return fetchData<UserInformation>("/users/me", { method: "GET" })
}

export async function fetchAllUserInformation(): Promise<UserInformation[]> {
    return fetchData<UserInformation[]>("/api/users", { method: "GET" })
}

export async function fetchUnacceptedBatches(): Promise<number[]> {
    return fetchData<number[]>("/api/update/unaccepted-batches", { method: "GET" })
}

export async function fetchUpdateBatchById(id: number): Promise<UpdateBatch> {
    return fetchData<UpdateBatch>("/api/update/batch/" + id, { method: "GET" })
}

export async function acceptBatch(batch_id: number): Promise<void> {
    return fetchData<void>(`/api/update/batch/${batch_id}/accept`, { method: "POST" })
}

export async function rejectBatch(batch_id: number): Promise<void> {
    return fetchData<void>(`/api/update/batch/${batch_id}`, { method: "DELETE" })
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
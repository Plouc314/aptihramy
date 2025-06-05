import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation, RecordValuesTrackedFeatures, TrackedYears } from "../types/api_types"
import { useErrorMessagesStore } from "./stores/errorMessages";
// Create an Axios instance


const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || "";
const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

async function fetchData<T>(endpoint: string, options: RequestInit, params?: Record<string, string | number>): Promise<T> {
    let url = API_BASE_URL + endpoint;
    const errorMessageStore = useErrorMessagesStore()

    if (params) {
        url += "?" + Object.entries(params)
            .map(([key, value]) => `${key}=${value.toString()}`)
            .join("&");
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) errorMessageStore.addErrorMessage(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Fetch error on ${url}: `, error);
        throw error;
    }
}

export async function checkToken(token: string): Promise<void> {
    let url = API_BASE_URL + "/api/check-token";

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Token check failed: ${response.status} ${response.statusText}`);
    }

    return;
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

export async function fetchRoot(): Promise<Root> {
    return fetchData<Root>("/api/", { method: "GET", headers: DEFAULT_HEADERS });
}

export async function fetchFilteredTrackers(featureSearchValue: FilterRequest): Promise<FilterResponse> {
    return fetchData<FilterResponse>("/api/filter", { method: "POST", headers: DEFAULT_HEADERS, body: JSON.stringify(featureSearchValue) });
}

export async function fetchTrackedFeatures(): Promise<TrackedFeatures> {
    return fetchData<TrackedFeatures>("/api/features", { method: "GET", headers: DEFAULT_HEADERS });
}

export async function fetchMaterializedFrames(tracker_id: string): Promise<TrackerInformation> {
    return fetchData<TrackerInformation>("/api/materialized_frames", { method: "GET", headers: DEFAULT_HEADERS }, { "tracker_id": tracker_id });
}

export async function fetchPersonValues(frame_idx: number, record_idx: number): Promise<RecordValuesTrackedFeatures> {
    return fetchData<RecordValuesTrackedFeatures>("/api/record", { method: "GET", headers: DEFAULT_HEADERS }, { "frame_idx": frame_idx.toString(), "record_idx": record_idx.toString() });
}

export async function fetchTrackedYears(): Promise<TrackedYears> {
    return fetchData<TrackedYears>("/api/tracked_years", { method: "GET", headers: DEFAULT_HEADERS })
}
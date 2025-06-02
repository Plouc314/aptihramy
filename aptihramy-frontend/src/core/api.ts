import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation, RecordValuesTrackedFeatures, TrackedYears } from "../types/api_types"
import { useSnackbarQueue } from "./snackbarQueue";
// Create an Axios instance
const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || "";
const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

async function fetchData<T>(endpoint: string, options: RequestInit, params?: Record<string, string | number>): Promise<T> {
    let url = API_BASE_URL + endpoint;

    if (params) {
        url += "?" + Object.entries(params)
            .map(([key, value]) => `${key}=${value.toString()}`)
            .join("&");
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) addSnackbar(`HTTP error! Status: ${response.status}`, snackbarTypes.ERROR);
        return await response.json();
    } catch (error) {
        console.error(`Fetch error on ${url}: `, error);
        throw error;
    }
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
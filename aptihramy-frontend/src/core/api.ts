import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation, RecordValuesTrackedFeatures, TrackedYears } from "../types/api_types"
import { useSnackbarQueue } from "./snackbarQueue";
// Create an Axios instance
const { addSnackbar, snackbarTypes } = useSnackbarQueue();

const BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

async function fetchData<T>(endpoint: string, options: RequestInit, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(endpoint, BASE_URL);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value.toString());
        });
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
    return fetchData<Root>("/", { method: "GET", headers: DEFAULT_HEADERS });
}

export async function fetchFilteredTrackers(featureSearchValue: FilterRequest): Promise<FilterResponse> {
    return fetchData<FilterResponse>("/filter", { method: "POST", headers: DEFAULT_HEADERS, body: JSON.stringify(featureSearchValue) });
}

export async function fetchTrackedFeatures(): Promise<TrackedFeatures> {
    return fetchData<TrackedFeatures>("/features", { method: "GET", headers: DEFAULT_HEADERS });
}

export async function fetchMaterializedFrames(tracker_id: string): Promise<TrackerInformation> {
    return fetchData<TrackerInformation>("/materialized_frames", { method: "GET", headers: DEFAULT_HEADERS }, { "tracker_id": tracker_id });
}

export async function fetchPersonValues(frame_idx: number, record_idx: number): Promise<RecordValuesTrackedFeatures> {
    return fetchData<RecordValuesTrackedFeatures>("/record", { method: "GET", headers: DEFAULT_HEADERS }, { "frame_idx": frame_idx.toString(), "record_idx": record_idx.toString() });
}

export async function fetchTrackedYears(): Promise<TrackedYears> {
    return fetchData<TrackedYears>("tracked_years", { method: "GET", headers: DEFAULT_HEADERS })
}
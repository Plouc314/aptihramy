import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation } from "../types/api_types"
// Create an Axios instance

const BASE_URL = "http://127.0.0.1:8000";
const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

async function fetchData<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = new URL(endpoint, BASE_URL);

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
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
    console.log(featureSearchValue)
    return fetchData<FilterResponse>("/filter", { method: "POST", headers: DEFAULT_HEADERS, body: JSON.stringify(featureSearchValue) });
}

export async function fetchTrackedFeatures(): Promise<TrackedFeatures> {
    return fetchData<TrackedFeatures>("/features", { method: "GET", headers: DEFAULT_HEADERS });
}

export async function fetchTrackerInformation(tracker_id_1: number, tracker_id_2: number): Promise<TrackerInformation> {
    const url = new URL("/tracker");
    url.searchParams.append("tracker_id_1", tracker_id_1.toString());
    url.searchParams.append("tracker_id_2", tracker_id_2.toString());

    return fetchData<TrackerInformation>(url.toString(), { method: "GET", headers: DEFAULT_HEADERS });
}

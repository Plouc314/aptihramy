import axios from "axios";
import { TrackedFeatures, Root, FilterRequest, FilterResponse, TrackerInformation } from "../types/api_types"
// Create an Axios instance
const apiClient = axios.create({
    baseURL: "http://127.0.0.1:8000",
    timeout: 5000,
    headers: {
        "Content-Type": "application/json",
    },
});

export async function getRoot(): Promise<Root> {
    try {
        const response = await apiClient.get<Root>("/")
        return response.data;
    } catch (error) {
        console.error("Error fetching root", error);
        throw error;
    }
}

export async function fetchFilteredTrackers(featureSearchValue: FilterRequest): Promise<FilterResponse> {
    try {
        const queryParam = JSON.stringify(Object.fromEntries(featureSearchValue));
        const response = await apiClient.get<FilterResponse>("/filter", { params: { filters: queryParam } })
        return response.data;
    } catch (error) {
        console.error("Error fetching filtered trackers:", error);
        throw error;
    }
};

export async function fetchTrackedFeatures(): Promise<TrackedFeatures> {
    try {
        const response = await apiClient.get<TrackedFeatures>("/features")
        return response.data;
    } catch (error) {
        console.error("Error fetching features:", error);
        throw error;
    }
}


export async function fetchTrackerInformation(tracker_id_1: number, tracker_id_2: number): Promise<TrackerInformation> {
    try {
        const response = await apiClient.get<TrackerInformation>("/tracker", { params: { tracker_id_1: tracker_id_1, tracker_id_2: tracker_id_2 } })
        return response.data;
    } catch (error) {
        console.error("Error fetching features:", error);
        throw error;
    }
}



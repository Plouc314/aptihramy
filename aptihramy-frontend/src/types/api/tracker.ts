import { MaterializedTrackerFrame } from "./records";

export type trackerID = string;

export interface TrackedYears {
    tracked_years: number[];
}

export interface MultiStringsFeatures {
    multistrings_features: string[];
}

export interface TrackedFeatures {
    raw_features: string[];
    pretty_features: string[];
}

export interface TrackerInformation {
    frames: MaterializedTrackerFrame[] | null;
}

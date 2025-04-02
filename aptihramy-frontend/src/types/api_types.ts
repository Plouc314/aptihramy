export type trackerID = string;


export interface FilterResponse {
    data: Record<trackerID, string[][]>
}

export interface FilterRequest {
    filters: Record<string, string>
}

export interface TrackedFeatures {
    raw_features: string[],
    pretty_features: string[]
}

export interface Root {
    message: string
}

export interface TrackerRecordDiagnostics {
    record_idx: number,
    record_score: number,
    distances: (number | null)[];
}

export interface TrackerFrameDiagnostics {
    frame_idx: number,
    records: TrackerRecordDiagnostics[],
    memory: string[][]
}

export interface TrackerDiagnostics {
    id: string,
    frames: TrackerFrameDiagnostics[]
}

export interface TrackerInformation {
    diagnostic: (TrackerDiagnostics | null)
}

export type FeatureValues = Map<string, (string | number | null)[]>

export interface RecordValuesTrackedFeatures {
    records: FeatureValues
}

export interface TrackedYears {
    tracked_years: number[]
}

export interface ChainNode {
    frame_idx: number,
    record_idx: number
}

export interface TrackingChain {
    tracking_chain: ChainNode[]
}

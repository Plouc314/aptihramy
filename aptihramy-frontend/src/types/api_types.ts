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

export interface RecordDiagnostics {
    record_score: number,
    distances: (number | null)[];
}

export interface RecordValuesDiag {
    record_idx: number,
    // List of raw values for all features (features are always sorted the same way)
    record_raw_values: (string | number)[],
    // List of normalized values for all features 
    record_normalized_values: (string | number)[],
    record_diagnostics: RecordDiagnostics | null
}

export interface MaterializedTrackerFrame {
    frame_idx: number,
    matching_record_idx: number | null,
    // Matching record (if any) and candidates records (if any)
    records: RecordValuesDiag[],
    memory: string[][] | null,
}


export interface TrackerInformation {
    frames: MaterializedTrackerFrame[] | null
}

export interface DiskDataStatus {
    ready: boolean,
    error: string | null | undefined
}
export type FeatureValues = Map<string, (string | number | null)[]>;

export interface RecordValuesTrackedFeatures {
    records: FeatureValues;
}

export interface RecordDiagnostics {
    record_score: number;
    distances: (number | null)[];
}

export interface RecordValuesDiag {
    record_idx: number;
    record_raw_values: (string | number)[];
    record_normalized_values: (string | number)[];
    record_diagnostics: RecordDiagnostics | null;
}

export interface MaterializedTrackerFrame {
    frame_idx: number;
    matching_record_idx: number | null;
    records: RecordValuesDiag[];
    memory: string[][] | null;
}

export interface RecordDiagnostics {
    record_score: number;
    distances: (number | null)[];
}

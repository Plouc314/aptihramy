import { RawElement } from "../base";


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

export interface FrameRecordPair {
    frame_idx: number;
    record_idx: number;
}

export interface RecordRequest {
    pairs: FrameRecordPair[]
}

export interface RecordModel {
    raw_values: RawElement[];
    normalized_values: RawElement[];
}

export interface RecordResult {
    frame_idx: number;
    record_idx: number;
    values: RecordModel | undefined;
    error: string | undefined
}

export interface RecordsResponse {
    results: RecordResult[];
}
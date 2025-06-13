export interface UpdateEntry {
    frame_idx: number;
    record_idx: number;
    field_idx: number;
    value: string | number;
}

export interface UpdateBatch {
    author: string;
    entries: UpdateEntry[];
    accepted: boolean;
    timestamp: string;
}

export interface DiskDataStatus {
    ready: boolean;
    error: string | undefined;
}

export interface DiskError {
    detail: string
}
export interface CandidateRecordValues {
    raw_value: string | number;
    normalized_value: string | number | null;
    memory: (string | number)[] | null;
    distances: number[] | null;
    score: number | null;
}

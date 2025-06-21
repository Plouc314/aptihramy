export interface CandidateRecordValues {
    raw_value: string | number | null;
    normalized_value: string | number | null;
    memory: (string | number)[] | null;
    distance: number | null;
    score: number | null;
}

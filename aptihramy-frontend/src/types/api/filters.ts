import { trackerID } from "./tracker";

export interface FilterRequest {
    filters: Record<string, string>;
    query_limit: number | undefined;
}

export interface FilterResponse {
    data: Record<trackerID, string[][]>;
}

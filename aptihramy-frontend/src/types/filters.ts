import { trackerID } from './tracker';

export interface FilterRequest {
    filters: Record<string, string>;
}

export interface FilterResponse {
    data: Record<trackerID, string[][]>;
}

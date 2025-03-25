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

export interface TrackerInformation {

}


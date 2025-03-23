export type trackerID = [number, number];


export interface FilterResponse {
    data: Map<string, string[][]>
}

export interface FilterResponseTest {
    data: Record<string, string[][]>;
}

export type FilterRequest = Map<string, string>;

export interface TrackedFeatures {
    raw_features: string[],
    pretty_features: string[]
}

export interface Root {
    message: string
}

export interface TrackerInformation{

}


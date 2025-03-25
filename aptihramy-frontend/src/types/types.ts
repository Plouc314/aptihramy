import { trackerID } from "./api_types";

// Define the shape of a record
export interface RecordType {
    [key: string]: string | number
}

export type TrackerIDMemory = Map<trackerID, string[][]>


export interface TopBarProps {
    resetZoom?: Function;
    goToEditPage?: Function;
    title: string;
}
export interface FeatureValues {
    feature: string
    values: string[]
}
export type ColumnRows = Map<string, string[]>


export interface DisplayPeopleProps {
    data: TrackerIDMemory
    isLoading: boolean;
}

export interface OneFrameInformationProps {
    trackedPersonIndex: number;
    frameIndex: number;
    nbColumns: number;
}

export interface FilterState {
    id: number;
    column: string;
    rowInput: string;
}

export interface FilterProps {
    canRemove: boolean;
    id: number;
    remainingColumns: string[];
}

export interface TrackinChainProps {
    trackedID: trackerID
}

export interface EditPageProps {
    trackedPersonIndex: number
}

export interface EditMetricsProps {
    mostProbableOption: string,
    probability: number,
    options: string[],
}
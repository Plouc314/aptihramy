import { RecordValuesDiag, trackerID } from "./api_types";

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

export interface TopBarTrackingChainProps {
    resetZoom: Function;
    goToEditPage: Function;
    title: string;
}

export interface TopBarEditPageProps {
    save: Function;
    title: string;
}

export type ColumnRows = Map<string, string[]>

export interface DisplayPeopleProps {
    data: TrackerIDMemory
    isLoading: boolean;
}

export interface OneFrameInformationProps {
    recordValuesDiagnostic: RecordValuesDiag | null,
    frameIdx: number,
    recordIdx: number,
    memory: string[][] | null,
    nbColumns: number;
}

export interface CandidateRecordValues {
    raw_value: string | number,
    normalized_value: string | number | null,
    memory: (string | number)[] | null
    distances: number[] | null
    score: number | null
}


export interface FilterState {
    id: number;
    feature: string;
    input: string;
}

export interface FilterProps {
    canRemove: boolean;
    id: number;
    feature?: string 
    value?: string
    remainingFeatures: string[];
    suggestions: string[];
}

export type FilterEmits = {
    (event: 'edit-filter', payload: FilterState): void;
    (event: 'delete-filter', payload: FilterState): void;
}

export interface TrackinChainProps {
    trackerID: trackerID
}

export interface EditPageProps {
    trackerID: trackerID
}

export interface EditMetricsProps {
    prettyFeature: string
    yearValues: Map<number, RawNormalizedValue[]>
    updatedValues: Map<number, string | number> | undefined
}

export type EditMetricsEmit = {
    (e: 'update-values', payload: string, a: Map<number, string | number>): void;
};

export interface Snackbar {
    message: string,
    type: string
}

export type NodePosition = { x: number, y: number }

export type FrameRecordIdx = { frameIdx: number, recordIdx: number }

export type RawNormalizedValue = { rawValue: string | number, normalizedValue: string | number }



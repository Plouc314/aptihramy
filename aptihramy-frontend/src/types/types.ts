import { TrackerFrameDiagnostics, TrackerFrameDiagnosticsTest, trackerID, TrackerRecordDiagnostics } from "./api_types";

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

export type ColumnRows = Map<string, string[]>

export interface DisplayPeopleProps {
    data: TrackerIDMemory
    isLoading: boolean;
}

export interface OneFrameInformationProps {
    diagnostic: TrackerFrameDiagnosticsTest | null,
    frameIdx: number,
    recordIdx: number,
    nbColumns: number;
}

export interface CompareFrameProps {
    frameDiag1: TrackerFrameDiagnostics
    recordIdx1: number;
    frameDiag2: TrackerFrameDiagnostics;
    recordIdx2: number;
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
    suggestions: string[];
}

export interface TrackinChainProps {
    trackerID: trackerID
}

export interface EditPageProps {
    trackerID: trackerID
}

export interface EditMetricsProps {
    mostProbableOption: string,
    probability: number,
    options: string[],
}

export interface Snackbar {
    message: string,
    type: string
}

export type NodePosition = { x: number, y: number }

export type FrameRecordIdx = { frameIdx: number, recordIdx: number }
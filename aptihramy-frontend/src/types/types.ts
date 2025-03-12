// Define the shape of a record
export interface RecordType {
    [key: string]: string | number
}

export interface TrackinChainTopBarProps {
    resetZoom: Function;
    goToEditPage: Function;
    title: string;
}

export type ColumnRows = Map<string, string[]>


export interface DisplayPeopleProps {
    selectedColumnsRows: ColumnRows;
} 

export interface OneFrameInformationProps {
    trackedPersonIndex: number;
    frameIndex: number;
    columns: number;
}

export interface FilterState {
    id: number;
    column: string;
    rows: string[];
}

export interface FilterProps {
    canRemove: boolean;
    id: number;
    remainingColumns: string[];
}

export interface TrackinChainProps {
    trackedPersonIndex: Number
}
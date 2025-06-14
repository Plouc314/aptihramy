import { trackerID } from "./api/api";

export type NodePosition = { x: number; y: number };
export type FrameRecordIdx = { frameIdx: number; recordIdx: number };
export type TrackerIDMemory = Map<trackerID, string[][]>;
export type ColumnRows = Map<string, string[]>;
export type RecordType = { [key: string]: string | number };

export interface UserInformation {
    id: string;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    is_verified: boolean;
}
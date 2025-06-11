// import { RecordValuesDiag, trackerID } from "./api/api";

// // ─── Basic Utility Types ────────────────────────────────────
// export type NodePosition = { x: number, y: number };
// export type FrameRecordIdx = { frameIdx: number, recordIdx: number };
// export type TrackerIDMemory = Map<trackerID, string[][]>;
// export type ColumnRows = Map<string, string[]>;
// export type RecordType = { [key: string]: string | number };

// // ─── Raw & Normalized Value Types ───────────────────────────
// export type IdxRawNormalizedValue = {
//     recordIdx: number;
//     rawValue: string | number;
//     normalizedValue: string | number;
// };

// export interface FeatureMatchForYear {
//     matchingRecordIndex: number;
//     candidates: IdxRawNormalizedValue[];
// }

// // Feature -> year -> raw and normalized of the matching record and the candidates records
// export type FeatureYearMatchMap = Map<string, Map<number, FeatureMatchForYear>>;

// // ─── Component Props ────────────────────────────────────────

// // -- Top Bar
// export interface TopBarProps {
//     resetZoom?: Function;
//     goToEditPage?: Function;
//     title: string;
// }

// export interface TopBarTrackingChainProps {
//     resetZoom: Function;
//     goToEditPage: Function;
//     title: string;
// }

// export interface TopBarEditPageProps {
//     save: Function;
//     title: string;
// }

// // -- Edit Page
// export interface EditPageProps {
//     trackerID: trackerID;
// }

// export interface EditMetricsProps {
//     prettyFeature: string;
//     frameIdxValues: Map<number, FeatureMatchForYear>;
//     updatedValues: Map<number, string | number> | undefined;
// }

// export interface FrameIdxRecordIdxValue {
//     frameIdx: number,
//     recordIdx: number,
//     value: string | number
// }

// export type EditMetricsEmit = {
//     (event: 'update-values', prettyFeature: string, frameRecordValue: FrameIdxRecordIdxValue[]): void;
// };

// // -- Tracking & People
// export interface TrackinChainProps {
//     trackerID: trackerID;
// }

// export interface DisplayPeopleProps {
//     data: TrackerIDMemory;
//     isLoading: boolean;
// }

// // -- Frame Details
// export interface OneFrameInformationProps {
//     recordValuesDiagnostic: RecordValuesDiag | null;
//     frameIdx: number;
//     recordIdx: number;
//     memory: string[][] | null;
//     nbColumns: number;
// }

// // -- Filtering
// export interface FilterState {
//     id: number;
//     feature: string;
//     input: string;
// }

// export interface FilterProps {
//     canRemove: boolean;
//     id: number;
//     feature?: string;
//     value?: string;
//     remainingFeatures: string[];
//     suggestions: string[];
// }

// export type FilterEmits = {
//     (event: 'edit-filter', payload: FilterState): void;
//     (event: 'delete-filter', payload: FilterState): void;
// };

// // -- Candidates
// export interface CandidateRecordValues {
//     raw_value: string | number;
//     normalized_value: string | number | null;
//     memory: (string | number)[] | null;
//     distances: number[] | null;
//     score: number | null;
// }

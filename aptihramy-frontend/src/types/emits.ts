import { FrameIdxRecordIdxValue } from "./components/edit";
import { FilterState } from "./components/filter";

export type EditMetricsEmit = {
    (event: 'update-values', prettyFeature: string, frameRecordValue: FrameIdxRecordIdxValue[]): void;
};


export type FilterEmits = {
    (event: 'edit-filter', payload: FilterState): void;
    (event: 'delete-filter', payload: FilterState): void;
};

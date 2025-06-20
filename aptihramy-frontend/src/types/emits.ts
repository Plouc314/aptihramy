import { FilterState } from "./components/filter";

export type EditMetricsEmit = {
    (event: 'update-values', prettyFeature: string, frameRecordValue: Map<number, string | number>): void;
};


export type FilterEmits = {
    (event: 'edit-filter', payload: FilterState): void;
    (event: 'delete-filter', payload: FilterState): void;
};

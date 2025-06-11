import { trackerID } from "../api/api";
import { FeatureMatchForYear } from "../feature";

export interface EditPageProps {
    trackerID: trackerID;
}

export interface EditMetricsProps {
    prettyFeature: string;
    frameIdxValues: Map<number, FeatureMatchForYear>;
    updatedValues: Map<number, string | number> | undefined;
}

export interface FrameIdxRecordIdxValue {
    frameIdx: number;
    recordIdx: number;
    value: string | number;
}

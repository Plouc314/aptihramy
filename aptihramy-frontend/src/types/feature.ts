export type IdxRawNormalizedValue = {
    recordIdx: number;
    rawValue: string | number;
    normalizedValue: string | number;
};

export interface FeatureMatchForYear {
    matchingRecordIndex: number;
    candidates: IdxRawNormalizedValue[];
}

// Feature -> frame index -> values
export type FeatureYearMatchMap = Map<string, Map<number, FeatureMatchForYear>>;

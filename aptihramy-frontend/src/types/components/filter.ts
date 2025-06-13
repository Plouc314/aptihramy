export interface FilterState {
    id: number;
    feature: string;
    input: string;
}

export interface FilterProps {
    canRemove: boolean;
    id: number;
    feature?: string;
    value?: string;
    remainingFeatures: string[];
    suggestions: string[];
}

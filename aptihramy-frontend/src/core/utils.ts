import { trackerID } from "@/types/api_types";

export function parseTupleString(input: string): trackerID {
    return input
        .replace(/[()]/g, '') // Remove parentheses
        .split(',')            // Split by comma
        .map(num => parseFloat(num.trim())) as trackerID; // Convert to number
}

export function trackedIDToString(input: trackerID): string {
    return `(${input[0]}, ${input[1]})`
}
import { RecordValuesDiag } from "../api/api";

export interface OneFrameInformationProps {
    recordValuesDiagnostic: RecordValuesDiag | null;
    frameIdx: number;
    recordIdx: number;
    memory: string[][] | null;
    nbColumns: number;
}

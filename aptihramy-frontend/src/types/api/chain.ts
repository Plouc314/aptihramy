export interface ChainNode {
    frame_idx: number;
    record_idx: number;
}

export interface TrackingChain {
    tracking_chain: ChainNode[];
}

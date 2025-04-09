from pydantic import BaseModel
from typing import List


class ChainNodeModel(BaseModel):
    frame_idx: int
    record_idx: int


class TrackingChainModel(BaseModel):
    tracking_chain: List[ChainNodeModel] | None

    @staticmethod
    def tracking_chain_to_base_model(l: list[tuple[int, int]]) -> "TrackingChainModel":
        return TrackingChainModel(
            tracking_chain=[ChainNodeModel(frame_idx=r[0], record_idx=r[1]) for r in l]
        )

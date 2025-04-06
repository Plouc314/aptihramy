from pydantic import BaseModel
from typing import List


class ChainNodeModel(BaseModel):
    frame_idx: int
    record_idx: int


class TrackingChainModel(BaseModel):
    tracking_chain: List[ChainNodeModel] | None

    @staticmethod
    def tracking_chain_to_base_model(l: list) -> "TrackingChainModel":
        return TrackingChainModel(
            tracking_chain=[
                ChainNodeModel(frame_idx=r.frame_idx, record_idx=r.record_idx) for r in l
            ]
        )

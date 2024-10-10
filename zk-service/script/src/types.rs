use serde::{Deserialize, Serialize};
use aligned_sdk::core::types::AlignedVerificationData;

#[derive(Deserialize)]
pub struct ProofRequest {
    pub grid: Vec<Vec<u8>>,
    pub solution: Vec<(u8, u8, u8)>,
}

#[derive(Serialize)]
pub struct ProofResponse {
    pub is_valid: bool,
    pub verification_data: Option<AlignedVerificationData>,
}
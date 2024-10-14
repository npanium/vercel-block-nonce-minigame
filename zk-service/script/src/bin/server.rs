use actix_web::{web, App, HttpServer, Responder};
use aligned_sdk::core::types::{
    AlignedVerificationData, Network, PriceEstimate, ProvingSystemId, VerificationData,
};
use aligned_sdk::sdk::{estimate_fee, get_payment_service_address};
use aligned_sdk::sdk::{get_next_nonce, submit_and_wait_verification};
use ethers::{
    core::{types::TransactionRequest},
    middleware::SignerMiddleware,
    providers::{Http, Middleware, Provider},
    signers::{LocalWallet, Signer},
    utils,
    prelude::*
  };
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::env;
use std::convert::TryFrom;

const BATCHER_URL: &str = "wss://batcher.alignedlayer.com";
const NETWORK: Network = Network::Holesky;
const ELF: &[u8] = include_bytes!("../../../program/elf/riscv32im-succinct-zkvm-elf");

// Hardcoded values for testing
const HARDCODED_RPC_URL: &str = "https://ethereum-holesky-rpc.publicnode.com";
const HARDCODED_PRIVATE_KEY: &str = ""; 

#[derive(Deserialize)]
struct GameData {
    num_bugs: usize,
}

#[derive(Serialize)]
struct ProofResponse {
    aligned_verification_data: AlignedVerificationData,
}

async fn submit_proof(game_data: web::Json<GameData>) -> impl Responder {
    let num_bugs = game_data.num_bugs;

    println!("Num Bugs: {}", num_bugs);
    // Load pre-computed proof
    let proof = std::fs::read(format!("proofs/proof_{}.bin", num_bugs))
        .expect("Failed to read pre-computed proof");

   
    // Set up ethers provider and wallet
    let rpc_url = HARDCODED_RPC_URL;
    let provider = Provider::<Http>::try_from(rpc_url.clone())
        .expect("Failed to create provider");
    let chain_id_str = "17000";
    let chain_id: u64 = chain_id_str
    .parse::<u64>()
    .expect("Failed to parse chain ID");
    let wallet: LocalWallet = HARDCODED_PRIVATE_KEY.parse::<LocalWallet>()
    .expect("Failed to parse the wallet")
    .with_chain_id(chain_id);

 // Prepare verification data
 let verification_data = VerificationData {
    proving_system: ProvingSystemId::SP1,
    proof,
    proof_generator_addr: wallet.address(),
    vm_program_code: Some(ELF.to_vec()),
    verification_key: None,
    pub_input: None,
};


    println!("Wallet: {:?}", wallet.address());

    let client = SignerMiddleware::new(provider, wallet.clone());
    let client = Arc::new(client);

    // Estimate fee
    let max_fee = estimate_fee(&rpc_url, PriceEstimate::Default)
        .await
        .expect("Failed to estimate fee");

        println!("Max Fee: {}", max_fee);
    // Get nonce
    let nonce = get_next_nonce(&rpc_url, wallet.address(), NETWORK)
        .await
        .expect("Failed to get nonce");

        println!("Nonce: {}", nonce);
    // Submit proof
    let aligned_verification_data = submit_and_wait_verification(
        BATCHER_URL,
        &rpc_url,
        NETWORK,
        &verification_data,
        max_fee,
        wallet,
        nonce,
    )
    .await
    .expect("Failed to submit and verify proof");

    web::Json(ProofResponse {
        aligned_verification_data,
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/submit-proof", web::post().to(submit_proof))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
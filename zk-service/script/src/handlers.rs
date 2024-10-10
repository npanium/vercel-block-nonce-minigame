use actix_web::{web, HttpResponse, Responder};
use sp1_sdk::{ProverClient, SP1Stdin};
use aligned_sdk::core::types::{PriceEstimate, AlignedVerificationData, Network, ProvingSystemId, VerificationData};
use aligned_sdk::sdk::{estimate_fee, submit_and_wait_verification, get_next_nonce};
use ethers::prelude::*;
use ethers::utils::hex;

use crate::state::AppState;
use crate::types::{ProofRequest, ProofResponse}; 

const ELF: &[u8] = include_bytes!("../../program/elf/riscv32im-succinct-zkvm-elf");
const NETWORK: Network = Network::Holesky;
const BATCHER_URL: &str = "wss://batcher.alignedlayer.com";

pub async fn generate_and_verify_proof(
    proof_req: web::Json<ProofRequest>,
    state: web::Data<AppState>,
) -> impl Responder {
    println!("Entering generate_and_verify_proof function");
    let rpc_url = state.rpc_url.as_str();
    let wallet = &state.wallet;

    println!("RPC URL: {}", rpc_url);
    println!("Wallet address: {:?}", wallet.address());


 // Deposit funds to batcher if needed
 let deposit_result = deposit_to_batcher(wallet.address(), state.signer.clone()).await;
 if let Err(e) = deposit_result {
     println!("Failed to deposit to batcher: {:?}", e);
     return HttpResponse::InternalServerError().json(ProofResponse {
         is_valid: false,
         verification_data: None,
     });
 }

 
    let mut stdin = SP1Stdin::new();
    println!("Writing grid and solution to stdin");

    for row in &proof_req.grid {
        for &cell in row {
            stdin.write(&cell);
        }
    }
    for &(x, y, value) in &proof_req.solution {
        stdin.write(&x);
        stdin.write(&y);
        stdin.write(&value);
        println!("Wrote solution ({}, {}) = {}", x, y, value);
    }

    println!("Setting up ProverClient");
    let client = ProverClient::new();
    println!("ProverClient setup complete");
    let (pk, vk) = client.setup(ELF);

    println!("Generating proof");
    let proof_result = client.prove(&pk, stdin).run();

    let serialized_proof = match proof_result {
        Ok(proof) => {
            println!("Proof generated successfully");
            
            // Verify the proof
            match client.verify(&proof, &vk) {
                Ok(_) => {
                    println!("Proof verified successfully.");
                    match bincode::serialize(&proof) {
                        Ok(serialized) => Some(serialized),
                        Err(e) => {
                            println!("Failed to serialize proof: {:?}", e);
                            None
                        }
                    }
                },
                Err(e) => {
                    println!("Proof verification failed: {:?}", e);
                    None
                }
            }
        },
        Err(e) => {
            println!("Error generating proof: {:?}", e);
            None
        }
    };

    let Some(serialized_proof) = serialized_proof else {
        return HttpResponse::BadRequest().json(ProofResponse {
            is_valid: false,
            verification_data: None,
        });
    };

    // If the proof is valid and serialized, continue with submitting to Aligned
    let verification_data = VerificationData {
        proving_system: ProvingSystemId::SP1,
        proof: serialized_proof,
        proof_generator_addr: wallet.address(),
        vm_program_code: Some(ELF.to_vec()),
        verification_key: None,
        pub_input: None,
    };

    println!("Estimating fee");
    let max_fee = estimate_fee(&rpc_url, PriceEstimate::Default)
        .await
        .expect("failed to fetch gas price from the blockchain");
    let max_fee_string = ethers::utils::format_units(max_fee, 18).unwrap();
    println!("Aligned Will use at most {max_fee_string} eth to verify your proof.");

    println!("Getting nonce");
    let nonce = get_next_nonce(rpc_url, wallet.address(), NETWORK)
        .await
        .expect("Failed to get next nonce");

    println!("Submitting and verifying..."); 
    let result = submit_and_wait_verification(
        BATCHER_URL,
        &rpc_url,
        NETWORK,
        &verification_data,
        max_fee,
        wallet.clone(),
        nonce,
    )
    .await.unwrap();

    println!(
        "Proof submitted and verified successfully on batch {}, claiming prize...",
        hex::encode(result.batch_merkle_root)
    );
    let response =  HttpResponse::Ok().json(ProofResponse {
                    is_valid: true,
                    verification_data: None,
                });
    let response = match result {
        Ok(aligned_verification_data) => {
            println!(
                "Proof submitted and verified successfully on batch {}",
                hex::encode(aligned_verification_data.batch_merkle_root)
            );
            HttpResponse::Ok().json(ProofResponse {
                is_valid: true,
                verification_data: Some(aligned_verification_data),
            })
        },
        Err(e) => {
            println!("Error submitting to Aligned: {:?}", e);
            HttpResponse::InternalServerError().json(ProofResponse {
                is_valid: false,
                verification_data: None,
            })
        }
    };

    println!("Returning response and exiting function.");
return response;
}
// Define ProofRequest and ProofResponse structs here
// or in a separate types.rs file if they are used across multiple modules

async fn deposit_to_batcher(
    from: Address,
    signer: Arc<SignerMiddleware<Provider<Http>, LocalWallet>>,
) -> Result<(), Box<dyn std::error::Error>> {
    let addr = get_payment_service_address(NETWORK);

    let tx = TransactionRequest::new()
        .from(from)
        .to(addr)
        .value(U256::from(4000000000000000u64)); // 0.004 ETH

    let pending_tx = signer.send_transaction(tx, None).await?;
    let receipt = pending_tx.await?;

    match receipt {
        Some(receipt) => {
            println!(
                "Payment sent. Transaction hash: {:x}",
                receipt.transaction_hash
            );
            Ok(())
        }
        None => Err("Payment failed".into()),
    }
}
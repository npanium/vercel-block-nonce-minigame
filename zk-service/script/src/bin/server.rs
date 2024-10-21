use actix_web::{web, App, HttpServer, Responder};
use aligned_sdk::core::types::{
    AlignedVerificationData, Network, PriceEstimate, ProvingSystemId, VerificationData,
};
use aligned_sdk::sdk::{estimate_fee, get_payment_service_address};
use aligned_sdk::sdk::{get_next_nonce, submit_and_wait_verification};
use dotenv::dotenv;
use ethers::utils::hex;
use ethers::{
    core::types::TransactionRequest,
    middleware::SignerMiddleware,
    prelude::*,
    providers::{Http, Middleware, Provider},
    signers::{LocalWallet, Signer},
};
use serde::{Deserialize, Serialize};
use sp1_sdk::{utils, ProverClient, SP1ProofWithPublicValues, SP1Stdin};
use std::convert::TryFrom;
use std::env;
use std::fs;
use std::sync::Arc;
use std::sync::Mutex;

const BATCHER_URL: &str = "wss://batcher.alignedlayer.com";
const NETWORK: Network = Network::Holesky;
const CHAIN_ID: u64 = 17000;

// Hardcoded values for testing
const HARDCODED_RPC_URL: &str = "https://ethereum-holesky-rpc.publicnode.com";
const HARDCODED_PRIVATE_KEY: &str = "";

// Struct to hold the game state
struct AppState {
    secret: Mutex<Option<u32>>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct SecretData {
    secret: u32,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct UserGuess {
    guess: u32,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct ResponseData {
    pub guess: u32,
    pub b: bool,
}

#[derive(Serialize)]
struct Response {
    success: bool,
    message: String,
}
// struct ProofResponse {
//     aligned_verification_data: AlignedVerificationData,
// }

async fn set_secret(data: web::Json<SecretData>, state: web::Data<AppState>) -> impl Responder {
    let mut secret = state.secret.lock().unwrap();
    *secret = Some(data.secret);
    web::Json(Response {
        success: true,
        message: "Secret set successfully".to_string(),
    })
}

async fn verify_guess(
    guess: web::Json<UserGuess>,
    state: web::Data<AppState>,
) -> Result<impl Responder, actix_web::Error> {
    dotenv().ok();

    let secret = state.secret.lock().unwrap().clone();

    match secret {
        None => {
            return Ok(web::Json(Response {
                success: false,
                message: "No secret has been set. Please set a secret first.".to_string(),
            }));
        }
        Some(secret) => {
            // Setup a tracer for logging.
            utils::setup_logger();

            let user_guess = guess.guess;
            println!(
                "Number of bugs guessed: {:?}, Secret: {}",
                user_guess, secret
            );

            let mut stdin = SP1Stdin::new();
            stdin.write(&user_guess);
            stdin.write(&secret);

            let elf_path = format!("../program/elf/riscv32im-succinct-zkvm-elf");
            let elf = fs::read(&elf_path).map_err(|e| {
                actix_web::error::ErrorInternalServerError(format!(
                    "Failed to read ELF file: {}",
                    e
                ))
            })?;

            println!("Setting up Prover Client with elf path-{}", elf_path);
            let client = ProverClient::new();
            let (pk, vk) = client.setup(&elf);

            println!("Generating proof...");
            let mut proof = client.prove(&pk, stdin).run().unwrap();

            let r = proof.public_values.read::<ResponseData>();
            println!("r: {:?}", r);
            println!("Local proof verification successful.");

            // On-chain verification
            // let rpc_url: String = env::var("RPC_URL").expect("RPC_URL not set");
            // println!("RPC URL: {}", rpc_url);

            // let provider =
            //     Provider::<Http>::try_from(rpc_url.clone()).expect("Failed to create provider");
            // let chain_id: u64 = CHAIN_ID;
            // let wallet: LocalWallet = env::var("PRIVATE_KEY")
            //     .expect("PRIVATE_KEY not set")
            //     .parse::<LocalWallet>()
            //     .expect("Failed to parse the wallet")
            //     .with_chain_id(chain_id);

            let guess_is_correct = r.b;

            if guess_is_correct {
                Ok(web::Json(Response {
                    success: true,
                    message: format!(
                        "Congratulations! Your guess of {} bugs is correct!",
                        user_guess
                    ),
                }))
            } else {
                Ok(web::Json(Response {
                    success: false,
                    message: format!("Proof verification failed: {}. Incorrect guess", user_guess),
                }))
            }
        }
    }
}

// println!("Local proof verification successful.");

// On-chain verification
// let rpc_url: String = env::var("RPC_URL").expect("RPC_URL not set");
// println("RPC URL: ", rpc_url);

// let provider = Provider::<Http>::try_from(rpc_url.clone())
//     .expect("Failed to create provider");
// let chain_id: u64 = CHAIN_ID;
// let wallet: LocalWallet = env::var("PRIVATE_KEY")
//     .expect("PRIVATE_KEY not set")
//     .parse::<LocalWallet>()
//     .expect("Failed to parse the wallet")
//     .with_chain_id(chain_id);

//     let verification_data = VerificationData {
//         proving_system: ProvingSystemId::SP1,
//         proof: bincode::serialize(&proof).expect("Failed to serialize proof"),
//         proof_generator_addr: wallet.address(),
//         vm_program_code: Some(elf.to_vec()),
//         verification_key: None,
//         pub_input: None,
//     };

//     println!("Wallet: {:?}", wallet.address());

//     let max_fee = estimate_fee(&rpc_url, PriceEstimate::Default)
//         .await
//         .expect("Failed to estimate fee");

//     println!("Max Fee: {}", max_fee);

//     let nonce = get_next_nonce(&rpc_url, wallet.address(), NETWORK)
//         .await
//         .expect("Failed to get nonce");

//     println!("Nonce: {}", nonce);

//     let aligned_verification_data = submit_and_wait_verification(
//         BATCHER_URL,
//         &rpc_url,
//         NETWORK,
//         &verification_data,
//         max_fee,
//         wallet.clone(),
//         nonce,
//     )
//     .await
//     .unwrap();

//     println!(
//         "Proof submitted and verified successfully on batch {}",
//         hex::encode(aligned_verification_data.batch_merkle_root)
//     );
//     Ok(web::Json(Response {
//         success: true,
//         message: format!(
//             "Congratulations! Your guess of {} bugs was verified correct. Verified on-chain in batch {}.",
//             num_bugs,
//             hex::encode(aligned_verification_data.batch_merkle_root)
//         ),
//     }))

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        secret: Mutex::new(None),
    });

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .route("/set-secret", web::post().to(set_secret))
            .route("/verify-guess", web::post().to(verify_guess))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

// // For Testing and experimentation. Run generate_proofs first.
// // Load pre-computed proof
// let proof_path = format!("proofs/proof_{}.bin", num_bugs);
// let proof_bytes = fs::read(&proof_path).map_err(|e| {
//     actix_web::error::ErrorInternalServerError(format!("Failed to read proof file: {}", e))
// })?;

// // Deserialize the proof
// let proof = bincode::deserialize(&proof_bytes).map_err(|e| {
//     actix_web::error::ErrorInternalServerError(format!("Failed to deserialize proof: {}", e))
// })?;

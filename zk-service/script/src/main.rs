use actix_web::{web, App, HttpServer};
use dotenv::dotenv;
use std::env;
use std::sync::Arc;
use ethers::signers::{LocalWallet, Signer}; 
use ethers::providers::Provider;
use ethers::middleware::SignerMiddleware;

mod state;
mod handlers;
mod types;

use state::AppState;
use handlers::generate_and_verify_proof;

// Hardcoded values for testing
const HARDCODED_RPC_URL: &str = "https://ethereum-holesky-rpc.publicnode.com";
const HARDCODED_PRIVATE_KEY: &str = "private_key_here"; 

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting application...");

    // Try to load .env file
    match dotenv() {
        Ok(_) => println!(".env file loaded successfully"),
        Err(e) => println!("Error loading .env file: {:?}", e),
    }

    // Use hardcoded values if env vars are not set
    let rpc_url = Arc::new(env::var("RPC_URL").unwrap_or_else(|_| {
        println!("RPC_URL not found in environment, using hardcoded value");
        HARDCODED_RPC_URL.to_string()
    }));
    
    let private_key = env::var("PRIVATE_KEY").unwrap_or_else(|_| {
        println!("PRIVATE_KEY not found in environment, using hardcoded value");
        HARDCODED_PRIVATE_KEY.to_string()
    });

    println!("RPC URL: {}", rpc_url);
    println!("Private Key (first 5 chars): {}", &private_key[..5]);

    let wallet: LocalWallet = private_key.parse().expect("Failed to parse private key");
    let wallet = wallet.with_chain_id(17000u64);

    let provider = Provider::<ethers::providers::Http>::try_from(rpc_url.as_str())
        .expect("Failed to connect to provider");

    let signer = Arc::new(SignerMiddleware::new(provider.clone(), wallet.clone()));

    let state = web::Data::new(AppState {
        rpc_url,
        wallet,
        signer,
    });

    println!("Starting server...");

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .route("/generate-proof", web::post().to(generate_and_verify_proof))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
use std::sync::Arc;
use ethers::prelude::*;
use ethers::signers::LocalWallet; 

pub struct AppState {
    pub rpc_url: Arc<String>,
    pub wallet: LocalWallet,
    pub signer: Arc<SignerMiddleware<Provider<Http>, LocalWallet>>,
}
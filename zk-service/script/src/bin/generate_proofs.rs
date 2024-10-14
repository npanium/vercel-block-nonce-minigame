use sp1_sdk::{ProverClient, SP1Stdin};
use std::fs;

const ELF: &[u8] = include_bytes!("../../../program/elf/riscv32im-succinct-zkvm-elf");

fn main() {
    let client = ProverClient::new();
    let (pk, vk) = client.setup(ELF);

    for num_bugs in 5..=10 {
        let mut stdin = SP1Stdin::new();
        stdin.write(&num_bugs.to_string());

        println!("Generating proof for {} bugs...", num_bugs);
        let proof = client.prove(&pk, stdin).run().expect("Proving failed");

        // Serialize the proof
        let serialized_proof = bincode::serialize(&proof).expect("Failed to serialize proof");
        
        // Save the serialized proof
        fs::write(format!("proofs/proof_{}.bin", num_bugs), serialized_proof)
            .expect("Failed to write proof to file");

        println!("Proof generated and saved for {} bugs", num_bugs);

        // Verify the proof (optional, but good for testing)
        client.verify(&proof, &vk).expect("Verification failed");
        println!("Proof verified for {} bugs", num_bugs);
    }
}
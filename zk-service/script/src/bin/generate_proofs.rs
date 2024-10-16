// Test/Experiment file. No purpose.

use sp1_sdk::{ProverClient, SP1Stdin};
use std::fs;

fn main() {
    let client = ProverClient::new();

    for num_bugs in 5..=10 {
       // Load the ELF file dynamically based on num_bugs
       let elf_path = format!("../program/elf/temp_program_{}", num_bugs);
       let elf = fs::read(&elf_path).expect(&format!("Failed to read ELF file: {}", elf_path));

       let (pk, vk) = client.setup(&elf);
       
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

        client.verify(&proof, &vk).expect("Verification failed");
        println!("Proof verified for {} bugs", num_bugs);
    }
}
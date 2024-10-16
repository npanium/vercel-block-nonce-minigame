#![no_main]
use tiny_keccak::{Hasher, Sha3};
sp1_zkvm::entrypoint!(main);


pub fn main() {
    let num_bugs = sp1_zkvm::io::read::<u32>();
  let mut match_found=false;

    let mut sha3 = Sha3::v256();
    let mut output = [0u8; 32];
    sha3.update(&num_bugs.to_le_bytes());
    sha3.finalize(&mut output);

    let valid_hash: [u8; 32] = [134, 188, 86, 252, 86, 175, 76, 60, 222, 2, 18, 130, 246, 183, 39, 238, 159, 144, 221, 99, 110, 11, 12, 113, 42, 133, 212, 22, 199, 94, 101, 45];
    
    if output != valid_hash {
        println!("Incorrect Guess");
        sp1_zkvm::io::commit(&match_found);
    } else {
        println!("Correct Guess!");
        match_found=true;
        sp1_zkvm::io::commit(&match_found);
    }
}
#![no_main]
sp1_zkvm::entrypoint!(main);
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
struct ResponseData {
    pub g: u32,
    pub b: bool,
}

pub fn main() {
    let user_guess = sp1_zkvm::io::read::<u32>();
    let secret = sp1_zkvm::io::read::<u32>();
    println!("User guess: {}, recorded secret: {}", user_guess, secret);

    if user_guess != secret {
        println!("Incorrect Guess");
        let response = ResponseData {
            g: user_guess,
            b: false,
        };
        sp1_zkvm::io::commit(&response);
    } else {
        println!("Correct Guess");
        let response = ResponseData {
            g: user_guess,
            b: true,
        };
        sp1_zkvm::io::commit(&response);
    }
}

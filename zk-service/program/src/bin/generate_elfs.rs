use std::fs;
use std::process::Command;
use std::{io::Write, thread::sleep, time::Duration};

    // Hash values correspond to the SHA3-256 hashes of "5", "6", "7", "8", "9", "10"
const VALID_HASHES: [[u8; 32]; 6] = [
    [134, 188, 86, 252, 86, 175, 76, 60, 222, 2, 18, 130, 246, 183, 39, 238, 159, 144, 221, 99, 110, 11, 12, 113, 42, 133, 212, 22, 199, 94, 101, 45],
    [12, 103, 53, 73, 129, 233, 6, 137, 5, 104, 11, 87, 137, 138, 212, 240, 75, 153, 60, 99, 235, 102, 170, 63, 25, 205, 253, 199, 29, 136, 7, 126],
    [143, 155, 81, 206, 98, 79, 1, 176, 164, 12, 159, 104, 186, 139, 176, 162, 192, 106, 167, 249, 93, 30, 210, 125, 107, 27, 94, 30, 153, 238, 94, 77],
    [209, 74, 50, 154, 25, 36, 89, 47, 175, 45, 75, 166, 220, 114, 125, 89, 175, 106, 250, 233, 131, 160, 194, 8, 191, 152, 2, 55, 182, 58, 90, 106],
    [118, 9, 67, 9, 116, 176, 135, 89, 84, 136, 193, 84, 191, 92, 7, 152, 135, 234, 208, 232, 239, 212, 5, 92, 209, 54, 253, 169, 106, 92, 203, 248],
    [221, 18, 30, 54, 150, 26, 4, 98, 126, 172, 255, 98, 151, 101, 221, 53, 40, 71, 30, 215, 69, 193, 227, 34, 34, 219, 74, 138, 95, 52, 33, 196],];


    fn main() {
        for (i, hash) in VALID_HASHES.iter().enumerate() {
            let num_bugs = i + 5; // 5 to 10
            generate_elf_for_hash(num_bugs, hash);
        }
    }
    
    fn generate_elf_for_hash(num_bugs: usize, hash: &[u8; 32]) {
        // Create a temporary Rust file
        let temp_file = format!("temp_program_{}.rs", num_bugs);
        let mut file = fs::File::create(&temp_file).expect("Failed to create temp file");
    
  // Write the Rust program
  writeln!(
    file,
    r#"
#![no_main]
use tiny_keccak::{{Hasher, Sha3}};
sp1_zkvm::entrypoint!(main);

pub fn main() {{
    let num_bugs = sp1_zkvm::io::read::<u32>();

    // Input validation: only allow numbers between 5 and 10
    match num_bugs {{
        Ok(n) if n >= 5 && n <= 10 => n,
        _ => {{
            sp1_zkvm::io::write(1, &[0]); // Indicate failure
            return;
        }}
    }};

    let mut sha3 = Sha3::v256();
    let mut output = [0u8; 32];
    sha3.update(num_bugs.as_bytes());
    sha3.finalize(&mut output);

    let valid_hash: [u8; 32] = {hash:?};

    if output == valid_hash {{
        sp1_zkvm::io::write(1, &[1]); // Indicate success
        sp1_zkvm::io::write(2, &num_bugs_int.to_le_bytes()); // Write the actual number
    }} else {{
        sp1_zkvm::io::write(1, &[0]); // Indicate failure
    }}
}}
"#,
    hash = hash
)
.expect("Failed to write to temp file");

    
        // Compile the Rust program to ELF
        let output = Command::new("cargo")
            .args(&["prove", "build", "--bin", &format!("temp_program_{}", num_bugs)])
            .output()
            .expect("Failed to execute cargo prove build");
    
        if !output.status.success() {
            eprintln!("Failed to compile ELF for {} bugs", num_bugs);
            eprintln!("Stderr: {}", String::from_utf8_lossy(&output.stderr));
            return;
        }
    
        // Wait for the ELF file to be written (sleep for a short duration)
        sleep(Duration::from_millis(100));
    
        // Clean up the temporary Rust file
        fs::remove_file(temp_file).expect("Failed to remove temp file");
    
        println!("Generated ELF for {} bugs", num_bugs);
    }
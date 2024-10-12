#![no_std]
#![no_main]

use sp1_zkvm::io;

sp1_zkvm::entrypoint!(main);

pub fn main() {
    const GRID_SIZE: usize = 4;
    const NUM_MISMATCHES: usize = 1;

 // Read the original grid
 let mut original_grid = [[0u8; GRID_SIZE]; GRID_SIZE];
 for row in original_grid.iter_mut() {
     for cell in row.iter_mut() {
         *cell = io::read();
     }
 }

 // Read the current (mismatched) grid
 let mut current_grid = [[0u8; GRID_SIZE]; GRID_SIZE];
 for row in current_grid.iter_mut() {
     for cell in row.iter_mut() {
         *cell = io::read();
     }
 }

    // Read the solution
    let mut solution = [(0u8, 0u8, 0u8); NUM_MISMATCHES];
    for mismatch in solution.iter_mut() {
        mismatch.0 = io::read(); // x
        mismatch.1 = io::read(); // y
        mismatch.2 = io::read(); // value
    }

    // Verify the solution
    let mut is_valid = true;
    let mut mismatches_corrected = 0;

    for &(x, y, value) in solution.iter() {
        if x >= GRID_SIZE as u8 || y >= GRID_SIZE as u8 {
            is_valid = false;
            break;
        }

        let x = x as usize;
        let y = y as usize;

        // Check if the proposed change actually corrects a mismatch
        if current_grid[x][y] != original_grid[x][y] && value == original_grid[x][y] {
            mismatches_corrected += 1;
            current_grid[x][y] = value; // Apply the correction
        } else {
            is_valid = false;
            break;
        }
    }

    // The solution is valid if all mismatches are corrected and the grids now match
    is_valid = is_valid && (mismatches_corrected == NUM_MISMATCHES) && (current_grid == original_grid);

    // Convert boolean to u32 and write the result
    let result = if is_valid { 1u32 } else { 0u32 };
    io::write(1, &result.to_le_bytes());
}
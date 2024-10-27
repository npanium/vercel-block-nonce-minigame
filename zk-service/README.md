# Block-Nonce (Mini Game) Verification Server

A Rust-based backend service handling zero-knowledge proof generation and verification for the Block-Nonce game using SP1 and Aligned Layer.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Setup](#setup)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Future Development](#future-development)

## Prerequisites

- Rust (latest stable version)
- SP1 toolchain
- Aligned CLI
- Access to Ethereum node (for on-chain verification)
- [Optional] Docker (for deterministic builds)

## Installation

1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>/rust-backend
```

2. Install SP1 toolchain:

```bash
curl -L https://sp1.succinct.xyz | bash
sp1up
```

3. Install dependencies in `script` directory :

```bash
cargo build -r
```

4. Create a `.env` file in the script directory from the example file:

```env
PRIVATE_KEY=your_private_key
RPC_URL=holesky_ethereum_node_url
```

## Setup

1. First, generate the ELF file for the program:

```bash
cd ../program
cargo prove build
```

2. Return to the server directory and start the verification server:

```bash
cd ../script
cargo run -r --bin server
```

The server will start on `http://127.0.0.1:8080`.

## Architecture

### Components

- **Server**: Actix-web based HTTP server
- **Proof Generator**: SP1 proof generation system
- **Verification System**: Two-tier verification (local and on-chain)
- **Aligned Integration**: On-chain proof submission and verification

### Flow

1. Game backend sets secret number of bugs
2. Player submits guess
3. Local proof generation and verification
4. [Optional] On-chain verification through Aligned Layer

## API Documentation

### Set Secret

```
POST /set-secret
Body: { "secret": number }
Response: {
    "success": boolean,
    "message": string,
    "proof_verified": boolean,
    "on_chain_verified": boolean
}
```

### Verify Guess (Local)

```
POST /verify-guess/local
Body: { "guess": number }
Response: {
    "success": boolean,
    "message": string,
    "proof_verified": boolean,
    "on_chain_verified": boolean
}
```

### Verify Guess (Full)

```
POST /verify-guess/full
Body: { "guess": number }
Response: {
    "success": boolean,
    "message": string,
    "proof_verified": boolean,
    "on_chain_verified": boolean
}
```

## Development

### Project Structure

```
rust-backend/
├── script/
│   ├─── src/
│   │   └── bin/
│   │       └── server.rs     # Server implementation
│   └── Cargo.toml
└── program/
    ├── src/
    │   └── main.rs    # ZK program implementation
    └── Cargo.toml
```

### Building

For development/production:

```bash
cargo build --release
```

## Future Development

### Proof Generation Optimization

- [ ] Implement proof caching system for repeated verifications
- [ ] Support batch proof generation for multiple games
- [ ] Optimize ELF file loading and memory usage
- [ ] Add support for concurrent proof generation

### Aligned Layer Integration

- [ ] Implement batch submission to Aligned Layer
- [ ] Add support for different proving systems supported by Aligned
- [ ] Optimize gas usage through batched verifications
- [ ] Enhanced proof status tracking and reporting

### Security & Reliability

- [ ] Add rate limiting for proof generation requests
- [ ] Implement request validation and sanitization
- [ ] Enhanced error handling and recovery
- [ ] Comprehensive logging system
- [ ] Automated backup systems for game states

### Feature Additions

- [ ] Support for multiple game modes with different verification rules
- [ ] Multi-session proof aggregation
- [ ] Dynamic difficulty adjustments
- [ ] Support for complex game states and rule sets
- [ ] Flexible secret management system

### Developer Experience

- [ ] Comprehensive testing suite
- [ ] Development environment tooling
- [ ] Integration testing with Aligned Layer testnet
- [ ] Performance benchmarking tools
- [ ] API documentation generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

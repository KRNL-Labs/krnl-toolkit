

## Overview

This project extends foundry as a method to building your smart contracts on KRNL

- `KRNL.sol`: Base contract providing authorization and validation mechanisms
- `TokenAuthority.sol`: Manages signing keypairs and validates kernel executions
- `Sample.sol`: Example implementation of a KRNL-based contract

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Git](https://git-scm.com/downloads)

## Installation

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Clone the repository:
```bash
git clone git@github.com:FadhilMulinya/10-minutes-tutorial.git
cd 10-minutes-tutorial
```

3. Install dependencies:
```bash
forge install
```

## Dependencies

This project relies on the following packages you need to install:

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install oasisprotocol/sapphire-paratime
```

## Configuration

### Remappings
Paste the following command on your cli
```bash
forge remappings > remappings.txt
```

paste the following content in the file created "remappings.txt":

```text
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@oasisprotocol/sapphire-paratime/=lib/sapphire-paratime/contracts/
ds-test/=lib/openzeppelin-contracts/lib/forge-std/lib/ds-test/src/
erc4626-tests/=lib/openzeppelin-contracts/lib/erc4626-tests/
forge-std/=lib/forge-std/src/
halmos-cheatcodes/=lib/openzeppelin-contracts/lib/halmos-cheatcodes/src/
openzeppelin-contracts/=lib/openzeppelin-contracts/
sapphire-paratime/=lib/sapphire-paratime/

```

### Foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
sapphire-testnet = "${SAPPHIRE_TESTNET_RPC_URL}"
sapphire-mainnet = "${SAPPHIRE_MAINNET_RPC_URL}"
```

## Contract Architecture

### KRNL.sol
Base contract that provides:
- Authorization checks for protected functions
- Token authority validation
- Kernel response processing

### TokenAuthority.sol
Manages:
- Signing keypairs for authorization
- Kernel validation
- Runtime digest verification
- Access control for dApps

### Sample.sol
Example implementation showing:
- How to extend KRNL
- Protected function implementation
- Kernel response handling

## Usage

### Build

```bash
forge build
```


### Deploy

### 1. Set up environment variables
```bash
# Set your private key (without the '0x' prefix)
export PRIVATE_KEY=your_private_key_here

# Set RPC URL
export SAPPHIRE_TESTNET_RPC_URL=https://testnet.sapphire.oasis.dev
```

### 2. Deploy TokenAuthority contract
```bash
forge create src/TokenAuthority.sol:TokenAuthority \
    --rpc-url $SAPPHIRE_TESTNET_RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args $YOUR_OWNER_ADDRESS
```

### 3. Verify Contract (Optional)

To verify your contract on the block explorer:
```bash
forge verify-contract \
    --chain-id 23295 \
    --compiler-version v0.8.24 \
    $DEPLOYED_ADDRESS \
    src/TokenAuthority.sol:TokenAuthority \
    $ETHERSCAN_API_KEY
```

Note: Replace `$YOUR_OWNER_ADDRESS` with the address that should own the TokenAuthority contract, and `$DEPLOYED_ADDRESS` with the actual deployed contract address if verifying.

## Development

### Local Testing

1. Start local node:
```bash
anvil
```


## Documentation

- [Oasis Sapphire Documentation](https://docs.oasis.dev/dapp/sapphire/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Foundry Book](https://book.getfoundry.sh/)

## License

UNLICENSED

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

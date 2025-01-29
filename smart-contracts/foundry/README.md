# KRNL Foundry Template

## Requirements
Make sure these tools are installed and up to date
    
- **Foundry**: Follow the instructions in the [Foundry book](https://book.getfoundry.sh/getting-started/installation) to install or run:
    ```bash
    curl -L https://foundry.paradigm.xyz | bash
    ```

## Steps

1.  Install dependencies:
    ```bash
    forge soldeer install
    ```

1.  Build the project:
    ```bash
    forge build
    ```

1.  Copy the **.env.example** file to **.env**:
    ```bash
    cp .env.example .env
    ```

1.  Fill what's marked required in **.env** file.

1.  Store your private keys **securely** with foundry:
    - Store the private key you want to use on Oasis Sapphire and update `WALLET_ADDRESS_OASIS` in **.env**:
        ```bash
        cast wallet import OasisWallet --interactive
        ```
    - Store the private key you want to use on Ethereum Sepolia and update `WALLET_ADDRESS_SEPOLIA` in **.env**:
        ```bash
        cast wallet import SepoliaWallet --interactive
        ```

1.  Deploy `TokenAuthority.sol`:
    - Deploy the TokenAuthority contract using `forge create`:
        ```bash
        source .env && \
        forge create src/TokenAuthority.sol:TokenAuthority \
        --rpc-url https://testnet.sapphire.oasis.io \
        --account OasisWallet \
        --broadcast \
        --verify --verifier sourcify \
        --constructor-args $WALLET_ADDRESS_OASIS
        ```
    - Save the deployed contract address to `.env`:
        ```bash
        TOKEN_AUTHORITY_CONTRACT_ADDRESS=<deployed_contract_address>
        ```

    - Get the TokenAuthority Public Key (the second value that's returned):
        ```bash
        source .env && \
        cast call $TOKEN_AUTHORITY_CONTRACT_ADDRESS \
        "getSigningKeypairPublicKey()(bytes,address)" \     
        --rpc-url https://testnet.sapphire.oasis.io
        ```

1.  Run the `DeploySample.s.sol` script:
    - Run this command to deploy and verify the Sample contract on Etherscan
        ```bash
        source .env && \
        forge script script/DeploySample.s.sol:DeploySample \
        --rpc-url "https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}" \
        --account SepoliaWallet --sender $WALLET_ADDRESS_SEPOLIA \
        --broadcast \
        --verify --verifier etherscan \
        --etherscan-api-key $ETHERSCAN_API_KEY
        ```

        OR if you can't get an Etherscan api key, run this to verify on Blockscout

        ```bash
        source .env && \
        forge script script/DeploySample.s.sol:DeploySample \ 
        --rpc-url "https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}" \
        --account SepoliaWallet --sender $WALLET_ADDRESS_SEPOLIA \
        --broadcast \
        --verify --verifier blockscout \
        --verifier-url 'https://eth-sepolia.blockscout.com/api/'
        ```

## About Foundry
**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

### Help

```shell
$ forge --help
$ forge script --help
$ cast --help
```
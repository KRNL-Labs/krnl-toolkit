# KRNL Toolkit


## You may use either Hardhat or Remix to deploy contracts

### For other smart contract development framworks, use the hyperlink below

# Hardhat

## 1. Install dependencies

```shell
npm run hh
```

## 2. Fill .env file

```shell
cp .env.example .env
```

Then, fill required parameters in the .env file with your own values.

## 3. Deploy Verify Register

```shell
npm run hdvr
```
**dvr stands for deploy, verify, and register**

Firstly, this command will deploy Token Authority and verify on Sourcify.

Secondly, this command will deploy your main smart contract and verify on Etherscan.

Thirdly, this command will register your TA and smart contract on KRNL registry smart contract.

---

### (Optional) A. Deploy only TA

```shell
npm run hta
```

This command will deploy only TA on Oasis Sapphire testnet and verify on Sourcify.

### (Optional) B. Deploy only primary smart contract

```shell
npm run hmain
```

This command will deploy only your main smart contract on Sepolia and verify on Etherscan.

You should deploy TA before using this command, because it will use the result from TA deployment as a constructor parameter.

### (Optional) C. Deploy TA and main smart contract altogether without registering on KRNL Platform

```shell
npm run hdeploy
```

### (Optional) D. Register on KRNL Platform only

```shell
npm run hregister
```

This command will register your TA and smart contract on KRNL registry smart contract.

You should deploy TA and main smart contract before using this command, because it will use TA address and smart contract address to register.

## Miscellaneous

```shell
npm run hcnc
```

This command will clean and compile the smart contracts.

Smart contract template folder [click here](https://github.com/KRNL-Labs/krnl-toolkit/tree/main/smart-contracts/hardhat/contracts)

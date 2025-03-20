// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import "@oasisprotocol/sapphire-contracts/contracts/EthereumUtils.sol";
// ===============================
// Step 1
// This TA contract is specifically built to be compatible with kernel ID 337 as an example.
// If you are using this source code as a project template, make sure you change the following lines.
// Line 57
// Line 58
// Line 59
// ===============================
// Step 2
// The decoding part from this TA contract is for comparing the responses from kernel(s).
// You would have to modify the data type to match your selected kernel(s).
// Line 106
// Line 108
// ===============================
// Step 3
// TA also checks the node whitelist and runtime digest of the node.
// If you intend to use RPC endpoints other than version “https://v0-0-1-rpc.node.lat”, please ensure that you update the following lines accordingly.
// Line 63
// Line 65
// ===============================
contract TokenAuthority is Ownable {
    Keypair private signingKeypair;
    Keypair private accessKeypair;
    bytes32 private signingKeypairRetrievalPassword;
    // https://api.docs.oasis.io/sol/sapphire-contracts/contracts/Sapphire.sol/library.Sapphire.html#secp256k1--secp256r1
    struct Keypair {
        bytes pubKey;
        bytes privKey;
    }
    struct Execution {
        uint256 kernelId;
        bytes result;
        bytes proof;
        bool isValidated;
        bool opinion;
        string opinionDetails;
        string err;
    }

    mapping(address => bool) private whitelist; // krnlNodePubKey to bool
    mapping(bytes32 => bool) private runtimeDigests; // runtimeDigest to bool
    mapping(uint256 => bool) private kernels; // kernelId to bool

    constructor(address initialOwner) Ownable(initialOwner) {
        signingKeypair = _generateKey();
        accessKeypair = _generateKey();
        
        // Set allowed kernel(s)
        // kernels[REPLACE_WITH_KERNEL_ID] = true;
        // kernels[REPLACE_WITH_KERNEL_ID] = true;
        // kernels[REPLACE_WITH_KERNEL_ID] = true;
        kernels[337] = true;

        // Set node whitelist
        whitelist[address(0xc770EAc29244C1F88E14a61a6B99d184bfAe93f5)] = true;
        // Set runtime digest
        runtimeDigests[
            0x876924e18dd46dd3cbcad570a87137bbd828a7d0f3cad309f78ad2c9402eeeb7
        ] = true;
    }

    modifier onlyAuthorized(bytes calldata auth) {
        (
            bytes32 entryId,
            bytes memory accessToken,
            bytes32 runtimeDigest,
            bytes memory runtimeDigestSignature,
            uint256 nonce,
            uint256 blockTimeStamp,
            bytes memory authSignature
        ) = abi.decode(
                auth,
                (bytes32, bytes, bytes32, bytes, uint256, uint256, bytes)
            );
        require(_verifyAccessToken(entryId, accessToken));
        _;
    }
    modifier onlyValidated(bytes calldata executionPlan) {
        require(_verifyExecutionPlan(executionPlan));
        _;
    }
    modifier onlyAllowedKernel(uint256 kernelId) {
        require(kernels[kernelId]);
        _;
    }


    function _validateExecution(
        bytes calldata executionPlan
    ) external view returns (bytes memory) {
        Execution[] memory _executions = abi.decode(
            executionPlan,
            (Execution[])
        );

        for (uint256 i = 0; i < _executions.length; i++) {
            // Change the line below to match with your selected kernel(s)
            if (_executions[i].kernelId == 337) {
                // Change the code below to match with the return data type of this kernel
                uint256 result = abi.decode(_executions[i].result, (uint256));
                if (result > 0) {
                    _executions[i].isValidated = true;
                    _executions[i].opinion = true;
                } else {
                    _executions[i].isValidated = false;
                    _executions[i].opinion = false;
                }
            }
            // ===============================
            // If you have more than 1 kernel, you can add more conditions
            // if (_executions[i].kernelId == REPLACE_WITH_KERNEL_ID) {
            //     // Change the code below to match with the return data type of this kernel
            //     bool foo = abi.decode(_executions[i].result, (bool));
            //     if (foo == true) {
            //         _executions[i].isValidated = true;
            //         _executions[i].opinion = true;
            //     } else {
            //         _executions[i].isValidated = false;
            //         _executions[i].opinion = false;
            //     }
            // }
            // ===============================
        }
        
        return abi.encode(_executions);
    }

    function _generateKey() private view returns (Keypair memory) {
        bytes memory seed = Sapphire.randomBytes(32, "");
        (bytes memory pubKey, bytes memory privKey) = Sapphire
            .generateSigningKeyPair(
                Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
                seed
            );
        return Keypair(pubKey, privKey);
    }

    function _verifyAccessToken(
        bytes32 entryId,
        bytes memory accessToken
    ) private view returns (bool) {
        bytes memory digest = abi.encodePacked(keccak256(abi.encode(entryId)));
        return
            Sapphire.verify(
                Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
                accessKeypair.pubKey,
                digest,
                "",
                accessToken
            );
    }

    function _verifyRuntimeDigest(
        bytes32 runtimeDigest,
        bytes memory runtimeDigestSignature
    ) private view returns (bool) {
        address recoverPubKeyAddr = ECDSA.recover(
            runtimeDigest,
            runtimeDigestSignature
        );
        return whitelist[recoverPubKeyAddr];
    }

    function _verifyExecutionPlan(
        bytes calldata executionPlan
    ) private pure returns (bool) {
        Execution[] memory executions = abi.decode(
            executionPlan,
            (Execution[])
        );
        for (uint256 i = 0; i < executions.length; i++) {
            if (!executions[i].isValidated) {
                return false;
            }
        }
        return true;
    }

    function _getFinalOpinion(
        bytes calldata executionPlan
    ) private pure returns (bool) {
        Execution[] memory executions = abi.decode(
            executionPlan,
            (Execution[])
        );
        for (uint256 i = 0; i < executions.length; i++) {
            if (!executions[i].opinion) {
                return false;
            }
        }
        return true;
    }

    function setSigningKeypair(
        bytes calldata pubKey,
        bytes calldata privKey
    ) external onlyOwner {
        signingKeypair = Keypair(pubKey, privKey);
    }

    function setSigningKeypairRetrievalPassword(
        string calldata _password
    ) external onlyOwner {
        signingKeypairRetrievalPassword = keccak256(
            abi.encodePacked(_password)
        );
    }

    function getSigningKeypairPublicKey()
        external
        view
        returns (bytes memory, address)
    {
        address signingKeypairAddress = EthereumUtils
            .k256PubkeyToEthereumAddress(signingKeypair.pubKey);
        return (signingKeypair.pubKey, signingKeypairAddress);
    }

    function getSigningKeypairPrivateKey(
        string calldata _password
    ) external view onlyOwner returns (bytes memory) {
        require(
            signingKeypairRetrievalPassword ==
                keccak256(abi.encodePacked(_password))
        );
        return signingKeypair.privKey;
    }

    function setWhitelist(
        address krnlNodePubKey,
        bool allowed
    ) external onlyOwner {
        whitelist[krnlNodePubKey] = allowed;
    }

    function setRuntimeDigest(
        bytes32 runtimeDigest,
        bool allowed
    ) external onlyOwner {
        runtimeDigests[runtimeDigest] = allowed;
    }

    function setKernel(uint256 kernelId, bool allowed) external onlyOwner {
        kernels[kernelId] = allowed;
    }

    function registerdApp(
        bytes32 entryId
    ) external view returns (bytes memory) {
        bytes memory digest = abi.encodePacked(keccak256(abi.encode(entryId)));
        bytes memory accessToken = Sapphire.sign(
            Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
            accessKeypair.privKey,
            digest,
            ""
        );
        return accessToken;
    }

    function isKernelAllowed(
        bytes calldata auth,
        uint256 kernelId
    ) external view onlyAuthorized(auth) returns (bool) {
        return kernels[kernelId];
    }

    // example use case: only give 'true' opinion when all kernels are executed with expected results and proofs
    function getOpinion(
        bytes calldata auth,
        bytes calldata executionPlan
    ) external view onlyAuthorized(auth) returns (bytes memory) {
        try this._validateExecution(executionPlan) returns (
            bytes memory result
        ) {
            return result;
        } catch {
            return executionPlan;
        }
    }

    function sign(
        bytes calldata auth,
        address senderAddress,
        bytes calldata executionPlan,
        bytes calldata functionParams,
        bytes calldata kernelParams,
        bytes calldata kernelResponses
    )
        external
        view
        onlyValidated(executionPlan)
        onlyAuthorized(auth)
        returns (bytes memory, bytes32, bytes memory, bool)
    {
        (
            bytes32 id,
            bytes memory accessToken,
            bytes32 runtimeDigest,
            bytes memory runtimeDigestSignature,
            uint256 nonce,
            uint256 blockTimeStamp,
            bytes memory authSignature // id, accessToken, runtimeDigest, runtimeDigestSignature, nonce, blockTimeStamp, authSignature
        ) = abi.decode(
                auth,
                (bytes32, bytes, bytes32, bytes, uint256, uint256, bytes)
            );
        // Compute kernelResponsesDigest
        bytes32 kernelResponsesDigest = keccak256(
            abi.encodePacked(kernelResponses, senderAddress)
        );
        bytes memory kernelResponsesSignature = Sapphire.sign(
            Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
            signingKeypair.privKey,
            abi.encodePacked(kernelResponsesDigest),
            ""
        );
        (, SignatureRSV memory kernelResponsesRSV) = EthereumUtils
            .toEthereumSignature(
                signingKeypair.pubKey,
                kernelResponsesDigest,
                kernelResponsesSignature
            );
        bytes memory kernelResponsesSignatureEth = abi.encodePacked(
            kernelResponsesRSV.r,
            kernelResponsesRSV.s,
            uint8(kernelResponsesRSV.v)
        );
        bytes32 functionParamsDigest = keccak256(functionParams);
        // Compute kernelParamsDigest
        bytes32 kernelParamsDigest = keccak256(
            abi.encodePacked(kernelParams, senderAddress)
        );
        bool finalOpinion = _getFinalOpinion(executionPlan);
        // Compute dataDigest
        bytes32 dataDigest = keccak256(
            abi.encodePacked(
                functionParamsDigest,
                kernelParamsDigest,
                senderAddress,
                nonce,
                finalOpinion
            )
        );
        bytes memory signature = Sapphire.sign(
            Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
            signingKeypair.privKey,
            abi.encodePacked(dataDigest),
            ""
        );
        (, SignatureRSV memory rsv) = EthereumUtils.toEthereumSignature(
            signingKeypair.pubKey,
            dataDigest,
            signature
        );
        bytes memory signatureToken = abi.encodePacked(
            rsv.r,
            rsv.s,
            uint8(rsv.v)
        );
        return (
            kernelResponsesSignatureEth,
            kernelParamsDigest,
            signatureToken,
            finalOpinion
        );
    }
}
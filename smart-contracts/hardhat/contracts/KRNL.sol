// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// Struct to group the parameters
struct KrnlPayload {
    bytes auth;
    bytes kernelResponses;
    bytes kernelParams;
}

struct KernelParameter {
    uint8 resolverType;
    bytes parameters;
    string err;
}

struct KernelResponse {
    uint256 kernelId;
    bytes result;
    string err;
}

// Draft Version
contract KRNL is Ownable {
    error UnauthorizedTransaction();

    address public tokenAuthorityPublicKey;
    mapping(bytes => bool) public executed;

    modifier onlyAuthorized(
        KrnlPayload memory krnlPayload,
        bytes memory params
    ) {
        if (!_isAuthorized(krnlPayload, params)) {
            revert UnauthorizedTransaction();
        }

        _;
    }

    constructor(address _tokenAuthorityPublicKey) Ownable(msg.sender) {
        tokenAuthorityPublicKey = _tokenAuthorityPublicKey;
    }

    function setTokenAuthorityPublicKey(
        address _tokenAuthorityPublicKey
    ) external onlyOwner {
        tokenAuthorityPublicKey = _tokenAuthorityPublicKey;
    }

    function _isAuthorized(
        KrnlPayload memory payload,
        bytes memory functionParams
    ) private view returns (bool) {
        
        (
            bytes memory kernelResponseSignature,
            bytes32 kernelParamObjectDigest,
            bytes memory signatureToken,
            uint256 nonce,
            bool finalOpinion
        ) = abi.decode(
                payload.auth,
                (bytes, bytes32, bytes, uint256, bool)
            );

        if (finalOpinion == false) {
            revert("Final opinion reverted");
        }

        bytes32 kernelResponsesDigest = keccak256(
            abi.encodePacked(payload.kernelResponses, msg.sender)
        );

        address recoveredAddress = ECDSA.recover(
            kernelResponsesDigest,
            kernelResponseSignature
        );

        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for kernel responses");
        }

        bytes32 _kernelParamsDigest = keccak256(
            abi.encodePacked(payload.kernelParams, msg.sender)
        );

        bytes32 functionParamsDigest = keccak256(functionParams);

        if (_kernelParamsDigest != kernelParamObjectDigest) {
            revert("Invalid kernel params digest");
        }

        bytes32 dataDigest = keccak256(
            abi.encodePacked(
                functionParamsDigest,
                kernelParamObjectDigest,
                msg.sender,
                nonce,
                finalOpinion
            )
        );

        recoveredAddress = ECDSA.recover(dataDigest, signatureToken);
        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for function call");
        }

        // executed[signatureToken] = true;
        return true;
    }
}
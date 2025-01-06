// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

struct KrnlPayload {
    bytes auth;
    bytes kernelResponses;
    bytes kernelParams;
}

struct KernelParameter {
    uint8 resolverType;
    bytes parameters;
}

struct KernelResponse {
    uint256 kernelId;
    bytes result;
    string err;
}

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
    ) private returns (bool) {
        (
            bytes memory kernelResponesSignature,
            bytes32 kernelParamsDigest,
            bytes memory signatureToken,
            bytes32 nonce,
            bool finalOpinion
        ) = abi.decode(payload.auth, (bytes, bytes32, bytes, bytes32, bool));

        if (!finalOpinion) {
            revert("Final opinion reverted");
        }

        if (executed[signatureToken]) {
            return false;
        }

        bytes32 kernelResponsesDigest = keccak256(
            abi.encode(payload.kernelResponses, msg.sender)
        );
        
        address recoveredAddress = ECDSA.recover(
            kernelResponsesDigest,
            kernelResponesSignature
        );

        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for kernel responses");
        }

        bytes32 _kernelParamsDigest = keccak256(
            abi.encode(payload.kernelParams, msg.sender)
        );

        if (_kernelParamsDigest != kernelParamsDigest) {
            revert("Invalid kernel params digest");
        }

        bytes32 functionParamsDigest = keccak256(abi.encode(functionParams));

        bytes32 dataDigest = keccak256(
            abi.encode(
                functionParamsDigest,
                kernelParamsDigest,
                msg.sender,
                nonce,
                finalOpinion
            )
        );

        recoveredAddress = ECDSA.recover(dataDigest, signatureToken);
        if (recoveredAddress != tokenAuthorityPublicKey) {
            revert("Invalid signature for function call");
        }

        executed[signatureToken] = true;
        return true;
    }
}
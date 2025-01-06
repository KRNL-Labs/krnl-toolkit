// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";

contract Sample is KRNL {
    // Token Authority public key as a constructor
    constructor(address _tokenAuthorityPublicKey) KRNL(_tokenAuthorityPublicKey) {}

    // Initial value of message when this contract is being created
    string message = "hello";

    // Results from kernel will be emitted through this event
    event Broadcast(address sender, uint256 score, string message);

    // Protected function
    function protectedFunction(
        KrnlPayload memory krnlPayload,
        string memory input
    )
        external
        onlyAuthorized(krnlPayload, abi.encode(input))
    {
        
        // Decode response from kernel
        KernelResponse[] memory kernelResponses = abi.decode(krnlPayload.kernelResponses, (KernelResponse[]));
        uint256 score;
        for (uint i; i < kernelResponses.length; i ++) {
            if (kernelResponses[i].kernelId == 337) {
                score = abi.decode(kernelResponses[i].result, (uint256));
            }
        }

        // Write new message
        message = input;

        // Emitting an event
        emit Broadcast(msg.sender, score, input);
    }

    // Read message from contract
    function readMessage() external view returns (string memory) {
        return message;
    }
}
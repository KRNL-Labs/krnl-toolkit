// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";
// ===============================
// This smart contract is specifically built to be compatible with kernel 337 as an example.
// If you are using this source code as a project template, make sure you change the following lines.
// Line 35
// Line 37
// ===============================
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
            // Change the line below to match with your selected kernel(s)
            if (kernelResponses[i].kernelId == 337) {
                // Change the code below to match with the return data type from this kernel
                score = abi.decode(kernelResponses[i].result, (uint256));
            }
            // ===============================
            // If you have more than 1 kernel, you can add more conditions
            // if (kernelResponses[i].kernelId == REPLACE_WITH_KERNEL_ID) {
            //     // Change the code below to match with the return data type from this kernel
            //     foo = abi.decode(kernelResponses[i].result, (bool));
            // }
            // ===============================
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

// ===============================
// Simple version of smart contract example. It does not contain the decoding part.
// No response from kernel is shown.
// No event is emitted during the transaction.
// ===============================

// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.24;

// import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";


// contract Sample is KRNL {
//     constructor(address _tokenAuthorityPublicKey) KRNL(_tokenAuthorityPublicKey) {}

//     string message = "hello";

//     function protectedFunction(
//         KrnlPayload memory krnlPayload,
//         string memory input
//     )
//         external
//         onlyAuthorized(krnlPayload, abi.encode(input))
//     {
//         message = input;
//     }

//     function readMessage() external view returns (string memory) {
//         return message;
//     }
// }

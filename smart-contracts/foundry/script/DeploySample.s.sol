// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Sample} from "src/Sample.sol";

contract DeploySample is Script {
    Sample sample;

    modifier broadcast() {
        vm.startBroadcast();
        _;
        vm.stopBroadcast();
    }

    function run() public broadcast {
        address tokenAuthorityPublicKeyAddress = vm.envAddress("TOKEN_AUTHORITY_PUBLIC_KEY_ADDRESS");
        console.log("======================================");
        console.log("DEPLOYER:", msg.sender);
        console.log("======================================");

        console.log("START DEPLOYING SAMPLE CONTRACT");
        sample = new Sample(tokenAuthorityPublicKeyAddress);
        console.log("======================================");
        console.log("Sample Contract deployed at: ", address(sample));
        console.log("======================================");
    }
}

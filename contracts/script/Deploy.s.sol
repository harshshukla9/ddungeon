// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {DarkestDungeon} from "../src/DarkestDungeon.sol";
import {Dungeon} from "../src/Token/Gametoken.sol"; // Import the Dungeon token contract

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = 0x0000000000000000000000000000000000000000000000000000000000000000; // 0000->deployerprivate key
       address deployerAddress = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying contracts using deployer address:", deployerAddress);

        address gasbackAddress = 0xdF329d59bC797907703F7c198dDA2d770fC45034;

        // Deploy Dungeon Token first
        Dungeon dungeonToken = new Dungeon();
        console.log("Deployed Dungeon Token at address: %s", address(dungeonToken));

        // Deploy DarkestDungeon with Dungeon token address
        DarkestDungeon game = new DarkestDungeon(deployerAddress, gasbackAddress, address(dungeonToken));
        console.log("Deployed Darkest Dungeon at address: %s", address(game));

        vm.stopBroadcast();
    }
}



//BaseTestnet

// Deploying contracts using deployer address: 0x58369AAED363a59022c98CD457Ea5e320Df395EB
//   Deployed Dungeon Token at address: 0x83F159aa37D8Bec7DE4651e9421c1f2db915A738
//   Deployed Darkest Dungeon at address: 0x1561Ca01EE9E3978Df9ac49dcA0d8e8f30929110

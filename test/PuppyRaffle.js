const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const hre = require("hardhat");
const { bigint } = require("hardhat/internal/core/params/argumentTypes");
describe("PuppyRuffle",async()=>{
    let dummyPlayers = [];
    for(let i = 0; i < 200; i++){
        dummyPlayers.push(hre.ethers.Wallet.createRandom().address);
    }

    async function deployPuppyRuffle(){
        const [owner, player1,player2,attacker] = await hre.ethers.getSigners()
        const entranceFee = hre.ethers.parseEther("0.1")
        const PuppyRuffle = await hre.ethers.getContractFactory("PuppyRaffle");
        const puppyRuffle = await PuppyRuffle.deploy(entranceFee,owner,3600);
        const Attack = await hre.ethers.getContractFactory("Attacker");
        const attack = await Attack.deploy(await puppyRuffle.getAddress(),entranceFee);
        return {owner,player1,player2,attacker,entranceFee,puppyRuffle,attack};
    }

    describe("Deploying",() =>{
        it("should deploy the PuppyRuffle contract", async ()=>{
            await loadFixture(deployPuppyRuffle);
        })
    });

    describe("Denial of service",() =>{
        it("Should second 100 accounts gas more expensive than first 100 accounts", async ()=>{
            const {puppyRuffle,entranceFee,player1,player2} = await loadFixture(deployPuppyRuffle);
            
            const firstBatchAccounts = dummyPlayers.slice(0,100);
            const secondBatchAccounts = dummyPlayers.slice(100,200);

            await puppyRuffle.connect(player1).enterRaffle(firstBatchAccounts,{value: entranceFee * 
                    BigInt(firstBatchAccounts.length)});
            const gasUsedFirst = BigInt(await hre.ethers.provider.getBlock("latest").then((block)=>block.gasUsed));
            console.log(gasUsedFirst);

            await puppyRuffle.connect(player2).enterRaffle(secondBatchAccounts,{value: entranceFee * 
                    BigInt(secondBatchAccounts.length)});
            const gasUsedSecond = BigInt(await hre.ethers.provider.getBlock("latest").then((block)=>block.gasUsed));
            console.log(gasUsedSecond);
            expect(gasUsedSecond.toString()>gasUsedFirst.toString());
        });
    });

    describe("Reetancy attack",()=>{
        it("should attacker enter the raffle and stole 100 timex moneys",async()=>{
            const {puppyRuffle,entranceFee,player1,player2,attack,attacker} = await loadFixture(deployPuppyRuffle);
            
            const firstBatchAccounts = dummyPlayers.slice(0,100);
            const secondBatchAccounts = dummyPlayers.slice(100,200);

            await puppyRuffle.connect(player1).enterRaffle(firstBatchAccounts,{value: entranceFee * 
                    BigInt(firstBatchAccounts.length)});

            await puppyRuffle.connect(player2).enterRaffle(secondBatchAccounts,{value: entranceFee * 
                    BigInt(secondBatchAccounts.length)});
            
            await attack.connect(attacker).enterRaffle({value: entranceFee * BigInt(2)});
            
            await attack.connect(attacker).attack();

            expect(await attack.getBalance()).to.equal(entranceFee * BigInt(101));
        })
    })
})
// # Copyright (c) 2019 Continental Automotive GmbH
// #
// # Alle Rechte vorbehalten. All Rights Reserved.
// # The reproduction, transmission or use of this document or its contents is
// # not permitted without express written authority.
// # Offenders will be liable for damages. All rights, including rights created
// # by patent grant or registration of a utility model or design, are reserved.


const web3 = require("web3");
const XBRToken = artifacts.require("./XBRToken.sol");
const XBRNetwork = artifacts.require("./XBRNetwork.sol");
const XBRMarket = artifacts.require("./XBRMarket.sol");
const request = require('request');


contract('XBRNetwork', function(accounts){
    //global test
    var network;
    var token;
    var w3;

    beforeEach('setup contract for each test', async () => {

        network = await XBRNetwork.deployed();
        token = await XBRToken.deployed();
        market = await XBRMarket.deployed();

        w3 = new web3(web3.givenProvider || 'http://localhost:1545');

        console.log('Using XBRNetwork         : ' + network.address);
        console.log('Using XBRToken           : ' + token.address);
    })

    it("create market and open buyer channel", async () => {

        const contract_owner = accounts[0]
        const market_owner = accounts[1];
        const market_maker = accounts[2];
        const buyer = accounts[3];
        const delegate = accounts[4];
        const terms = "";
        const meta = "";
        const marketFee = 0;
        const marketId = web3.utils.sha3("TestMarket").substring(0, 34);
        const consumerSecurity = 0;
        const providerSecurity = 0;
        const eula = await network.eula();
        const profile = ""
        const ActorType_CONSUMER = 2

        let txn =  await network.register(eula, profile, {from: buyer})
        txn =  await network.register(eula, profile, {from: market_owner})
        let hash = await market.createMarket(marketId, terms, meta, market_maker, providerSecurity, consumerSecurity, 
            marketFee, {from: market_owner});
        await market.joinMarket(marketId, ActorType_CONSUMER, meta, {from: buyer});

        await token.transfer(buyer, 100)
        await token.approve(market.address, 10, {from: buyer});
        //only market owner is allowed to get off-chain transaction ?? unclear why! 
        let txn_paymentchannel = await market.openPaymentChannel(marketId, market_owner, delegate, 10, 860000, {from: buyer})
        console.log("create payment channel gas consumptio " + txn_paymentchannel.receipt.gasUsed)
    })


    it("open seller channel", async () => {
        const market_owner = accounts[1];
        const seller = accounts[5];
        const delegate = accounts[6];
        const market_maker = accounts[2]
        const meta = "";
        const marketId = web3.utils.sha3("TestMarket").substring(0, 34);
        const eula = await network.eula();
        const profile = ""
        const ActorType_Provider = 1

        let txn =  await network.register(eula, profile, {from: seller})
        await market.joinMarket(marketId, ActorType_Provider, meta, {from: seller});

        await token.transfer(market_maker, 100)
        await token.approve(market.address, 10, {from: market_maker});
        //only market owner is allowed to get off-chain transaction ?? unclear why! 
        let txn_paying = await market.openPayingChannel(marketId, seller, delegate, 10, 666000, {from: market_maker})
        console.log("create paying channel gas consumptio " + txn_paying.receipt.gasUsed)
    })
})

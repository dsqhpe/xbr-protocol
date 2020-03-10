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


contract('XBRToken', function (accounts) {

    var gaspriceInEuro = null;
    const Eth2Euro = 167
    before('get gasprice from gasstation before test', function(done) {
        request('https://ethgasstation.info/json/ethgasAPI.json', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            gaspriceInEuro = body.average * 0.0000000001 * Eth2Euro 
            console.log("current gasprice is: " + gaspriceInEuro + " Euro")
            done()
        });
    });

    it("XBRToken gas consumption: token transfer", async () => {
        let token = await XBRToken.deployed();
        let hash = await token.transfer(accounts[5], 9000);
        tx_cost = hash.receipt.gasUsed * gaspriceInEuro
        console.log("transaction costs " + tx_cost + " Euro")
        assert(tx_cost < 0.13, "transaction to expensive -> " + tx_cost + " Euro")
    });

});

contract('XBRNetwork', function(accounts){
    //global test
    var network;
    var token;
    var gaspriceInEuro = null;
    const Eth2Euro = 167

    before('get gasprice from gasstation before test', function(done) {
        
        request('https://ethgasstation.info/json/ethgasAPI.json', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            gaspriceInEuro = body.average * 0.0000000001 * Eth2Euro 
            console.log("current gasprice is: " + gaspriceInEuro + " Euro")
            done()
        });
    });

    beforeEach('setup contract for each test', async () => {

        network = await XBRNetwork.deployed();
        token = await XBRToken.deployed();
        market = await XBRMarket.deployed();

        console.log('Using XBRNetwork         : ' + network.address);
        console.log('Using XBRToken           : ' + token.address);
    })

    //you can save 5 eurocents if you are registering without profile
    it("XBRNetwork gas consumption: register", async () => {
        const eula = await network.eula();
        //we are only using this to have a IPFS hash sized value
        const profile = eula;
        bob = accounts[1];
        carl = accounts[2];
        let hash = await network.register(eula, '', {from: bob});
        tx_cost = hash.receipt.gasUsed * gaspriceInEuro
        console.log("register costs without profile string: " + tx_cost + " Euro")
        assert(tx_cost < 0.16, "registration to expensive -> " + tx_cost + " Euro")
        hash = await network.register(eula, profile, {from: carl});
        tx_cost = hash.receipt.gasUsed * gaspriceInEuro
        console.log("register costs " + tx_cost + " Euro")
        assert(tx_cost < 0.24, "registration to expensive -> " + tx_cost + " Euro")
    });

    it("create market gas consumption", async () => {
        const alice = accounts[0];
        const maker = accounts[1];
        const terms = "";
        const meta = "";
        const marketFee = 0;
        const marketId = web3.utils.sha3("TestMarket").substring(0, 34);
        const consumerSecurity = 0;
        const providerSecurity = 0;
        let hash = await market.createMarket(marketId, terms, meta, maker, providerSecurity, consumerSecurity, marketFee, {from: alice});
        tx_cost = hash.receipt.gasUsed * gaspriceInEuro
        console.log("create market costs " + tx_cost + " Euro")
        assert(tx_cost < 0.37, "transaction to expensive -> " + tx_cost + " Euro")
    })

    it("Join Market gas consumption", async () => {

        const providerSecurity = 5;
        const owner = accounts[0];
        const provider = accounts[1];
        const ActorTyp_PROVIDER = 1;
        const marketId = web3.utils.sha3("TestMarket").substring(0, 34);
        const meta = "";

        // transfer 1000 XBR to provider
        await token.transfer(provider, 2000000, {from: owner});

        // approve transfer of tokens to join market
        const txn_approve = await token.approve(network.address, providerSecurity, {from: provider});

        // XBR provider joins market
        const txn_join = await market.joinMarket(marketId, ActorTyp_PROVIDER, meta, {from: provider});

        tx_cost = (txn_approve.receipt.gasUsed + txn_join.receipt.gasUsed) * gaspriceInEuro
        console.log("join market costs " + tx_cost + " Euro")
        assert(tx_cost < 0.37, "join market to expensive -> " + tx_cost + " Euro")
    })

})

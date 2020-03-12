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
    const Eth2Euro = 167;
    var market_maker = accounts[2];
    var buyer = accounts[3];

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
        let hash = await token.transfer(market_maker, 1001);
        hash = await token.transfer(buyer, 1002)
        tx_cost = hash.receipt.gasUsed * gaspriceInEuro
        console.log("transaction costs " + tx_cost + " Euro")
        assert(tx_cost < 0.13, "transaction to expensive -> " + tx_cost + " Euro")
    });

});

contract('XBRNetwork', function(accounts){

    var gaspriceInEuro = null;
    const Eth2Euro = 167
    var contract_owner = accounts[0];
    var market_operator = accounts[1];
    var market_maker = accounts[2];
    var buyer = accounts[3];
    var buyer_delegate = accounts[4];
    var seller = accounts[5];
    var seller_delegate = accounts[6];
    const marketId = web3.utils.sha3("TestMarket").substring(0, 34);

    var registration_gasConsumptio = 0
    var createMarket_gasConsumptio = 0
    var joinMarket_gasConsumptio = 0
    var buyerChannel_gasConsumptio = 0

    before('get gasprice from gasstation before test', function(done) {
        
        request('https://ethgasstation.info/json/ethgasAPI.json', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            gaspriceInEuro = body.average * 0.0000000001 * Eth2Euro 
            console.log("current gasprice is: " + gaspriceInEuro + " Euro")
            done()
        });
    });

    before('setup contract for each test', async () => {

        const network = await XBRNetwork.deployed();
        const token = await XBRToken.deployed();
        const market = await XBRMarket.deployed();

        console.log('Using XBRNetwork         : ' + network.address);
        console.log('Using XBRToken           : ' + token.address);
        console.log('Using XBRMarket          : ' + market.address);

        const eula = await network.eula();
        //we are only using this to have a IPFS hash sized value
        const profile = eula;
        const terms = "";
        const meta = "";
        const marketFee = 0;
        const consumerSecurity = 0;
        const providerSecurity = 0;
        const ActorTyp_PROVIDER = 1;
        const ActorTyp_CONSUMER = 2;

        //registration without profile cheaper because data not stored in contract 
        registration_gasConsumptio = await network.register(eula, profile, {from: market_operator});
        registration_gasConsumptio = await network.register(eula, '', {from: market_maker});
        registration_gasConsumptio = await network.register(eula, '', {from: seller});
        registration_gasConsumptio = await network.register(eula, '', {from: buyer});

        createMarket_gasConsumptio = await market.createMarket(marketId, terms, meta, market_maker, 
                                providerSecurity, consumerSecurity, marketFee, {from: market_operator});

        joinMarket_gasConsumptio = await market.joinMarket(marketId, ActorTyp_PROVIDER, meta, {from: seller});
        joinMarket_gasConsumptio = await market.joinMarket(marketId, ActorTyp_CONSUMER, meta, {from: buyer});


        await token.transfer(buyer, 100)
        await token.approve(market.address, 10, {from: buyer});
        //only market owner is allowed to get off-chain transaction ?? unclear why! 
        buyerChannel_gasConsumptio = await market.openPaymentChannel(marketId, market_operator, buyer_delegate, 10, 860000, {from: buyer})

        await token.transfer(market_maker, 100)
        await token.approve(market.address, 10, {from: market_maker});
        sellerChannel_gasConsumptio = await market.openPayingChannel(marketId, seller, seller_delegate, 10, 666000, {from: market_maker})
    })

    it("Registration costs:", () => {
        tx_cost = registration_gasConsumptio.receipt.gasUsed * gaspriceInEuro
        console.log("register costs are: " + tx_cost + " Euro")
        assert(tx_cost < 0.16, "registration to expensive -> " + tx_cost + " Euro")
    })

    it("Create Market costs:", () => {
        tx_cost = createMarket_gasConsumptio.receipt.gasUsed * gaspriceInEuro
        console.log("create market costs are: " + tx_cost + " Euro")
        assert(tx_cost < 0.37, "create market to expensive -> " + tx_cost + " Euro")
    })

    it("Join Market costs:", () => {
        tx_cost = joinMarket_gasConsumptio.receipt.gasUsed * gaspriceInEuro
        console.log("join market costs: " + tx_cost + " Euro")
        assert(tx_cost < 0.38, "join market to expensive -> " + tx_cost + " Euro")
    })

    it("Open Buyer Channel costs:", () => {
        tx_cost = buyerChannel_gasConsumptio.receipt.gasUsed * gaspriceInEuro
        console.log("open market costs: " + tx_cost + " Euro")
        assert(tx_cost < 0.38, "join market to expensive -> " + tx_cost + " Euro")
    })

    it("Open Seller Channel costs: ", () => {
        tx_cost = sellerChannel_gasConsumptio.receipt.gasUsed * gaspriceInEuro
        console.log("Open Seller Channel costs " + tx_cost + " Euro")
        assert(tx_cost < 0.38, "Open Seller Channel to expensive -> " + tx_cost + " Euro")
    })
})

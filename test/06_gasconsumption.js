// # Copyright (c) 2019 Continental Automotive GmbH
// #
// # Alle Rechte vorbehalten. All Rights Reserved.
// # The reproduction, transmission or use of this document or its contents is
// # not permitted without express written authority.
// # Offenders will be liable for damages. All rights, including rights created
// # by patent grant or registration of a utility model or design, are reserved.


const web3 = require("web3");
var XBRToken = artifacts.require("./XBRToken.sol");
const request = require('request');

//https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethgettransactionreceipt
contract('XBRToken', function (accounts) {

    var gaspriceInEuro = null;
    const Eth2Euro = 167
    beforeEach('get gasprice from gasstation before test', function(done) {
        request('https://ethgasstation.info/json/ethgasAPI.json', { json: true }, (err, res, body) => {
            if (err) { return console.log(err); }
            gaspriceInEuro = body.average * 0.0000000001 * Eth2Euro 
            console.log("current gasprice is: " + gaspriceInEuro + " Euro")
            done()
        });
    });

    it("XBRToken gas consumption: token transfer", async () => {
        let instance = await XBRToken.deployed();
        let hash = await instance.transfer(accounts[2], 1000);
        tx_cost = hash.receipt.gasUsed * gaspriceInEuro
        console.log("transaction costs " + tx_cost + " Euro")
        assert(tx_cost < 0.13, "transaction to expensive")
    });

});

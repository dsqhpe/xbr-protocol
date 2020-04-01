///////////////////////////////////////////////////////////////////////////////
//
//  XBR Open Data Markets - https://xbr.network
//
//  JavaScript client library for the XBR Network.
//
//  Copyright (C) Crossbar.io Technologies GmbH and contributors
//
//  Licensed under the Apache 2.0 License:
//  https://opensource.org/licenses/Apache-2.0
//
///////////////////////////////////////////////////////////////////////////////

const web3 = require("web3");
const utils = require("./utils.js");
const ethUtil = require('ethereumjs-util');

const XBRNetwork = artifacts.require("./XBRNetwork.sol");
const XBRToken = artifacts.require("./XBRToken.sol");
const XBRChannel = artifacts.require("./XBRChannel.sol");
const XBRMarket = artifacts.require("./XBRMarket.sol");


// dicether/eip712
// eth-sig-util
// eth_sig_utils.signTypedData
// eth_sig_utils.recoverTypedSignature
// https://github.com/MetaMask/eth-sig-util#signtypeddata-privatekeybuffer-msgparams
// https://github.com/MetaMask/eth-sig-util#signtypeddata-privatekeybuffer-msgparams

var w3_utils = require("web3-utils");
var eth_sig_utils = require("eth-sig-util");
var eth_accounts = require("web3-eth-accounts");
var eth_util = require("ethereumjs-util");


const DomainData = {
    types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ],
        ChannelClose: [
            {'name': 'channel_adr', 'type': 'address'},
            {'name': 'channel_seq', 'type': 'uint32'},
            {'name': 'balance', 'type': 'uint256'},
            {'name': 'is_final', 'type': 'bool'},
        ]
    },
    primaryType: 'ChannelClose',
    domain: {
        name: 'XBR',
        version: '1',
        chainId: 1,
        verifyingContract: '0x254dffcd3277C0b1660F6d42EFbB754edaBAbC2B',
    },
    message: null,
};



function create_sig(key_, message_) {

    DomainData['message'] = message_;

    const key = eth_util.toBuffer(key_);

    const sig = eth_sig_utils.signTypedData(key, {data: DomainData})

    return eth_util.toBuffer(sig);
}


contract('XBRNetwork', accounts => {

    //const gasLimit = 6721975;
    const gasLimit = 0xfffffffffff;
    //const gasLimit = 100000000;

    // deployed instance of XBRNetwork
    var network;

    // deployed instance of XBRNetwork
    var token;

    // deployed instance of XBRMarket
    var market;

    var channel;

    // Token used for market
    var coin;

    // https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html#if-i-return-an-enum-i-only-get-integer-values-in-web3-js-how-to-get-the-named-values

    // enum MemberLevel { NULL, ACTIVE, VERIFIED, RETIRED, PENALTY, BLOCKED }
    const MemberLevel_NULL = 0;
    const MemberLevel_ACTIVE = 1;
    const MemberLevel_VERIFIED = 2;
    const MemberLevel_RETIRED = 3;
    const MemberLevel_PENALTY = 4;
    const MemberLevel_BLOCKED = 5;

    // enum DomainStatus { NULL, ACTIVE, CLOSED }
    const DomainStatus_NULL = 0;
    const DomainStatus_ACTIVE = 1;
    const DomainStatus_CLOSED = 2;

    // enum ActorType { NULL, PROVIDER, CONSUMER, PROVIDER_CONSUMER }
    const ActorType_NULL = 0;
    const ActorType_PROVIDER = 1;
    const ActorType_CONSUMER = 2;
    const ActorType_PROVIDER_CONSUMER = 3;

    // enum ChannelType { NULL, PAYMENT, PAYING }
    const ChannelType_NULL = 0;
    const ChannelType_PAYMENT = 1;
    const ChannelType_PAYING = 2;

    // enum NodeType { NULL, MASTER, CORE, EDGE }
    const NodeType_NULL = 0;
    const NodeType_MASTER = 1;
    const NodeType_CORE = 2;
    const NodeType_EDGE = 3;

    // Securitues
    const providerSecurity = 100 * Math.pow(10,18);
    const providerSecurity_ = '0x' + providerSecurity.toString(16);
    const consumerSecurity =  20 * Math.pow(10,18);
    const consumerSecurity_ = '0x' + consumerSecurity.toString(16);

    // 5% market fee
    // FIXME: how to write a large uint256 literal?
    // const marketFee = '' + Math.trunc(0.05 * 10**9 * 10**18);
    const marketFee = 0;
    const organizationFee = 0.01;
    var organization;

    var marketId;

    // Amounts for channels and purchases
    const payingChannelAmount = '0x' + (115 * Math.pow(10,18)).toString(16);
    // const payingChannelAmount_ = '0x' + payingChannelAmount.toString(16);
    const paymentChannelAmount = '0x' + (110 * Math.pow(10,18)).toString(16);
    // const paymentChannelAmount_ = '0x' + paymentChannelAmount.toString(16);
    const amountSelled = '0x' + (100 * Math.pow(10,18)).toString(16);
    // const amountSelled_ = '0x' + amountSelled.toString(16);
    const amountBuyed = '0x' + (100 * Math.pow(10,18)).toString(16)
    // const amountBuyed_ = '0x' + amountBuyed.toString(16)

    //
    // test accounts setup
    //
    const account0 = accounts[0];
    const operator = accounts[1]; // market owner
    const maker = accounts[2];
    const provider = accounts[3];
    const providerDelegate = accounts[4];
    const consumer = accounts[5];
    const consumerDelegate = accounts[6];
    const provCons = accounts[7];
    const provConsDelegate = accounts[8];

    beforeEach('setup contract for each test', async function () {
        token = await XBRToken.deployed();
        network = await XBRNetwork.deployed();
        market = await XBRMarket.deployed();
        channel = await XBRChannel.deployed();

        console.log('Using XBRToken           : ' + token.address);
        console.log('Using XBRNetwork         : ' + network.address);
        console.log('Using XBRMarket          : ' + market.address);
        console.log('Using XBRChannel         : ' + channel.address);
        organization = w3_utils.toChecksumAddress(await network.organization());

        coin = token;

        const eula = "QmV1eeDextSdUrRUQp9tUXF8SdvVeykaiwYLgrXHHVyULY";
        const profile = "QmQMtxYtLQkirCsVmc3YSTFQWXHkwcASMnu5msezGEwHLT";

        const _operator = await network.members(operator);
        const _operator_level = _operator.level.toNumber();
        if (_operator_level == MemberLevel_NULL) {
            await network.registerMember(eula, profile, {from: operator, gasLimit: gasLimit});
        }

        const _provider = await network.members(provider);
        const _provider_level = _provider.level.toNumber();
        if (_provider_level == MemberLevel_NULL) {
            await network.registerMember(eula, profile, {from: provider, gasLimit: gasLimit});
        }

        const _consumer = await network.members(consumer);
        const _consumer_level = _consumer.level.toNumber();
        if (_consumer_level == MemberLevel_NULL) {
            await network.registerMember(eula, profile, {from: consumer, gasLimit: gasLimit});
        }

        const _provCons = await network.members(provCons);
        const _provCons_level = _provCons.level.toNumber();
        if (_provCons_level == MemberLevel_NULL) {
            await network.registerMember(eula, profile, {from: provCons, gasLimit: gasLimit});
        }

        marketId = utils.sha3("MyMarket1").substring(0, 34);
        const market_ = await market.markets(marketId);
        console.log("Number of markets created : " + market_.created.toNumber());

        if (market_.created.toNumber() == 0) {
            const terms = "";
            const meta = "";

            await market.createMarket(marketId, coin.address, terms, meta, maker, providerSecurity_, consumerSecurity_, marketFee, {from: operator, gasLimit: gasLimit});


            if (providerSecurity) {
                // remember XBR token balance of network contract before joining market
                // const _balance_network_before = await token.balanceOf(network.address);

                // transfer security to provider
                await coin.transfer(provider, providerSecurity_, {from: account0, gasLimit: gasLimit});

                // approve transfer of tokens to join market
                await coin.approve(market.address, providerSecurity_, {from: provider, gasLimit: gasLimit});
            }

            // XBR provider joins market
            await market.joinMarket(marketId, ActorType_PROVIDER, meta, {from: provider, gasLimit: gasLimit});


            if (consumerSecurity) {
                // remember XBR token balance of network contract before joining market
                // const _balance_network_before = await token.balanceOf(network.address);

                // transfer security to consumer
                await coin.transfer(consumer, consumerSecurity_, {from: account0, gasLimit: gasLimit});

                // approve transfer of tokens to join market
                await coin.approve(market.address, consumerSecurity_, {from: consumer, gasLimit: gasLimit});
            }

            // XBR consumer joins market
            await market.joinMarket(marketId, ActorType_CONSUMER, meta, {from: consumer, gasLimit: gasLimit});


            if (providerSecurity || consumerSecurity) {
                // remember XBR token balance of network contract before joining market
                // const _balance_network_before = await token.balanceOf(network.address);

                provConsSecurity_ = '0x' + (providerSecurity + consumerSecurity).toString(16);
                // transfer security to provider_consumer
                await coin.transfer(provCons, provConsSecurity_, {from: account0, gasLimit: gasLimit});

                // approve transfer of tokens to join market
                await coin.approve(market.address, provConsSecurity_, {from: provCons, gasLimit: gasLimit});
            }

            // XBR provider_consumer joins market
            await market.joinMarket(marketId, ActorType_PROVIDER_CONSUMER, meta, {from: provCons, gasLimit: gasLimit});
        }
    });


    it('XBRChannel.openChannel() : channel opened by maker for consumer', async () => {
        await coin.transfer(consumer, paymentChannelAmount, {from: account0, gasLimit: gasLimit});

        const balanceOperatorBefore = await coin.balanceOf(operator);
        const balanceMakerBefore = await coin.balanceOf(maker);
        const balanceConsumerBefore = await coin.balanceOf(consumer);
        // balance of beneficiary of transfer in openChannel

        const blockNumber = 0;//await web3.eth.getBlockNumber();
        const channelId = utils.sha3("ChannelPaymentTestOpen").substring(0, 34);
        await channel.openChannel(ChannelType_PAYMENT, blockNumber, marketId, channelId,
            consumer, consumerDelegate, maker, operator, paymentChannelAmount, eth_util.toBuffer("0xdeadbeef"),
            {from: maker, gasLimit: gasLimit});

        const balanceOperatorAfter = await coin.balanceOf(operator);
        const balanceMakerAfter = await coin.balanceOf(maker);
        const balanceConsumerAfter = await coin.balanceOf(consumer);
        // balance of beneficiary of transfer in openChannel

        assert.equal('' + balanceMakerAfter, '' + balanceMakerBefore,
            "Maker's token balance should not change.");
        assert.equal('' + balanceOperatorAfter, '' + balanceOperatorBefore,
            "Operator's token balance should not change.");
        // Not implemented -> will fail
        assert.equal('' + balanceConsumerAfter, '' + (balanceConsumerBefore - paymentChannelAmount),
            "Consumer's token balance doesn't match.");
        // Not implemented
        // Check balance of beneficiary of transfer in openChannel
    });


    it('XBRChannel.openChannel() : channel opened by maker for provider', async () => {
        await coin.transfer(operator, payingChannelAmount, {from: account0, gasLimit: gasLimit});

        const balanceOperatorBefore = await coin.balanceOf(operator);
        const balanceMakerBefore = await coin.balanceOf(maker);
        const balanceProviderBefore = await coin.balanceOf(provider);
        // balance of beneficiary of transfer in openChannel

        const blockNumber = 0;//await web3.eth.getBlockNumber();
        const channelId = utils.sha3("ChannelPayingTestOpen").substring(0, 34);
        await channel.openChannel(ChannelType_PAYING, blockNumber, marketId, channelId,
           operator, providerDelegate, maker, provider, payingChannelAmount, eth_util.toBuffer("0xcafebabe"),
           {from: maker, gasLimit: gasLimit});

        const balanceOperatorAfter = await coin.balanceOf(operator);
        const balanceMakerAfter = await coin.balanceOf(maker);
        const balanceProviderAfter = await coin.balanceOf(provider);
        // balance of beneficiary of transfer in openChannel

        assert.equal('' + balanceMakerAfter, '' + balanceMakerBefore,
            "Maker's token balance should not change.");
        assert.equal('' + balanceProviderAfter, '' + balanceProviderBefore,
            "Provider's token balance should not change.");
        // Not implemented -> will fail
        assert.equal('' + balanceOperatorAfter, '' + (balanceOperatorBefore - payingChannelAmount),
            "Operator's token balance doesn't match.");
        // Not implemented
        // Check balance of beneficiary of transfer in openChannel
    });


    it('XBRChannel.closeChannel() : channel closed by maker for consumer', async () => {
        const channelId = utils.sha3("ChannelPaymentTestClose").substring(0, 34);

        // Open the channel to close
        await coin.transfer(consumer, paymentChannelAmount, {from: account0, gasLimit: gasLimit});
        const blockNumber = 0;//await web3.eth.getBlockNumber();
        await channel.openChannel(ChannelType_PAYMENT, blockNumber, marketId, channelId,
           consumer, consumerDelegate, maker, operator, paymentChannelAmount, eth_util.toBuffer("0xdeadbeef"),
           {from: maker, gasLimit: gasLimit});

        // To remove when implementation is complete
        await coin.transfer(channel.address, paymentChannelAmount, {from: account0, gasLimit: gasLimit});

        const balanceOperatorBefore = await coin.balanceOf(operator);
        const balanceMakerBefore = await coin.balanceOf(maker);
        const balanceConsumerBefore = await coin.balanceOf(consumer);
        const balanceOrganizationBefore = await coin.balanceOf(organization);
        // balance recipient market fee
        // balance of beneficiary of transfer in openChannel

        const refund = paymentChannelAmount - amountBuyed;
        const refund_ = '0x' + refund.toString(16);
        await channel.closeChannel(channelId, 1, refund_, true, eth_util.toBuffer("0xbaad"), eth_util.toBuffer("0xbeef"),
           {from: maker, gasLimit: gasLimit});

        const balanceOperatorAfter = await coin.balanceOf(operator);
        const balanceMakerAfter = await coin.balanceOf(maker);
        const balanceConsumerAfter = await coin.balanceOf(consumer);
        const balanceOrganizationAfter = await coin.balanceOf(organization);
        // balance recipient market fee
        // balance of beneficiary of transfer in openChannel

        const feeOrganization = amountBuyed * organizationFee;
        const feeMarket = amountBuyed * marketFee;
        const payout = amountBuyed - feeOrganization - feeMarket;

        assert.equal('' + balanceMakerAfter, '' + balanceMakerBefore,
            "Maker's token balance should not change.");
        assert.equal('' + balanceOperatorAfter, '' + (Number(balanceOperatorBefore) + payout),
            "Operator's token balance doesn't match.");
        assert.equal('' + balanceConsumerAfter, '' + (Number(balanceConsumerBefore) + refund),
            "Consumer's token balance doesn't match.");
        assert.equal('' + balanceOrganizationAfter, '' + (Number(balanceOrganizationBefore) + feeOrganization),
            "Organization's token balance doesn't match.");
        // Not implemented
        // check recipient market fee, feeMarket
        // Not implemented
        // Check balance of beneficiary of transfer in openChannel
    });


    it('XBRChannel.closeChannel() : channel closed by maker for provider', async () => {
        const channelId = utils.sha3("ChannelPayingTestClose").substring(0, 34);

        // Open the channel to close
        await coin.transfer(operator, payingChannelAmount, {from: account0, gasLimit: gasLimit});
        const blockNumber = 0;//await web3.eth.getBlockNumber();
        await channel.openChannel(ChannelType_PAYING, blockNumber, marketId, channelId,
           operator, providerDelegate, maker, provider, payingChannelAmount, eth_util.toBuffer("0xcafebabe"),
           {from: maker, gasLimit: gasLimit});

        // To remove when implementation is complete
        await coin.transfer(channel.address, payingChannelAmount, {from: account0, gasLimit: gasLimit});

        const balanceOperatorBefore = await coin.balanceOf(operator);
        const balanceMakerBefore = await coin.balanceOf(maker);
        const balanceProviderBefore = await coin.balanceOf(provider);
        const balanceOrganizationBefore = await coin.balanceOf(organization);
        // balance recipient market fee
        // balance of beneficiary of transfer in openChannel

        const refund = payingChannelAmount - amountSelled;
        const refund_ = '0x' + refund.toString(16);
        await channel.closeChannel(channelId, 1, refund_, true, eth_util.toBuffer("0xbaad"), eth_util.toBuffer("0xcafe"),
           {from: maker, gasLimit: gasLimit});

        const balanceOperatorAfter = await coin.balanceOf(operator);
        const balanceMakerAfter = await coin.balanceOf(maker);
        const balanceProviderAfter = await coin.balanceOf(provider);
        const balanceOrganizationAfter = await coin.balanceOf(organization);
        // balance recipient market fee
        // balance of beneficiary of transfer in openChannel

        const feeOrganization = amountSelled * organizationFee;
        const feeMarket = amountSelled * marketFee;
        const payout = amountSelled - feeOrganization - feeMarket;

        assert.equal('' + balanceMakerAfter, '' + balanceMakerBefore,
            "Maker's token balance should not change.");
        assert.equal('' + balanceProviderAfter, '' + (Number(balanceProviderBefore) + payout),
            "Provider's token balance doesn't match.");
        assert.equal('' + balanceOperatorAfter, '' + (Number(balanceOperatorBefore) + refund),
            "Operator's token balance doesn't match.");
        assert.equal('' + balanceOrganizationAfter, '' + (Number(balanceOrganizationBefore) + feeOrganization),
            "Organization's token balance doesn't match.");
        // Not implemented
        // check recipient market fee, feeMarket
        // Not implemented
        // Check balance of beneficiary of transfer in openChannel
    });


    it('XBRMarket.getAllPay*Channels()', async () => {
        const channelIdPayment = utils.sha3("ChannelPaymentTestGetAllPay*Channels").substring(0, 34);
        const channelIdPaying = utils.sha3("ChannelPayingTestGetAllPay*Channels").substring(0, 34);

        var allPaymentChannels = await market.getAllPaymentChannels(marketId, consumer);
        var allPayingChannels = await market.getAllPayingChannels(marketId, provider);
        assert.ok(!allPaymentChannels.includes(channelIdPayment), "Channel payment found but not opened yet.");
        assert.ok(!allPayingChannels.includes(channelIdPaying), "Channel paying found but not opened yet.");

        // Open channels
        const amount = '0';
        const refund_ = '0';
        const blockNumber = 0;//await web3.eth.getBlockNumber();
        await coin.transfer(consumer, amount, {from: account0, gasLimit: gasLimit});
        await coin.transfer(operator, amount, {from: account0, gasLimit: gasLimit});
        await channel.openChannel(ChannelType_PAYMENT, blockNumber, marketId, channelIdPayment,
            consumer, consumerDelegate, maker, operator, paymentChannelAmount, eth_util.toBuffer("0xdeadbeef"),
            {from: maker, gasLimit: gasLimit});
        await channel.openChannel(ChannelType_PAYING, blockNumber, marketId, channelIdPaying,
            operator, providerDelegate, maker, provider, payingChannelAmount, eth_util.toBuffer("0xcafebabe"),
            {from: maker, gasLimit: gasLimit});

        // To remove when implementation is complete
        await coin.transfer(channel.address, amount, {from: account0, gasLimit: gasLimit});
        await coin.transfer(channel.address, amount, {from: account0, gasLimit: gasLimit});

        // Open and close channel don't update Actor.channels -> will fail
        allPaymentChannels = await market.getAllPaymentChannels(marketId, consumer);
        allPayingChannels = await market.getAllPayingChannels(marketId, provider);
        assert.ok(allPaymentChannels.includes(channelIdPayment), "Channel payment not found.");
        assert.ok(allPayingChannels.includes(channelIdPaying), "Channel paying not found.");

        // Close channels
        await channel.closeChannel(channelIdPaying, 1, refund_, true, eth_util.toBuffer("0xbaad"), eth_util.toBuffer("0xcafe"),
            {from: maker, gasLimit: gasLimit});
        await channel.closeChannel(channelIdPayment, 1, refund_, true, eth_util.toBuffer("0xbaad"), eth_util.toBuffer("0xbeef"),
            {from: maker, gasLimit: gasLimit});

        // Open and close channel don't update Actor.channels -> will fail
        allPaymentChannels = await market.getAllPaymentChannels(marketId, consumer);
        allPayingChannels = await market.getAllPayingChannels(marketId, provider);
        // Don't know it channel will be remove of the list
        // assert.ok(allPaymentChannels.includes(channelIdPayment), "Channel payment not found.");
        // assert.ok(allPayingChannels.includes(channelIdPaying), "Channel paying not found.");
    });

    it('XBRMarket.currentPay*ChannelByDelegate()', async () => {
        const channelIdPayment = utils.sha3("ChannelPaymentTestCurrentPay*ChannelByDelegate").substring(0, 34);
        const channelIdPaying = utils.sha3("ChannelPayingTestCurrentPay*ChannelByDelegate").substring(0, 34);

        const addressNull = "0x0000000000000000000000000000000000000000";
        var currentPaymentChannel = await market.currentPaymentChannelByDelegate(marketId, consumerDelegate);
        var currentPayingChannel = await market.currentPayingChannelByDelegate(marketId, providerDelegate);
        assert.equal(currentPaymentChannel, addressNull, "Channel payment found but not opened yet.");
        assert.equal(currentPayingChannel, addressNull, "Channel paying found but not opened yet.");

        // Open channels
        const amount = '0';
        const refund_ = '0';
        const blockNumber = 0;//await web3.eth.getBlockNumber();
        await coin.transfer(consumer, amount, {from: account0, gasLimit: gasLimit});
        await coin.transfer(operator, amount, {from: account0, gasLimit: gasLimit});
        await channel.openChannel(ChannelType_PAYMENT, blockNumber, marketId, channelIdPayment,
            consumer, consumerDelegate, maker, operator, paymentChannelAmount, eth_util.toBuffer("0xdeadbeef"),
            {from: maker, gasLimit: gasLimit});
        await channel.openChannel(ChannelType_PAYING, blockNumber, marketId, channelIdPaying,
            operator, providerDelegate, maker, provider, payingChannelAmount, eth_util.toBuffer("0xcafebabe"),
            {from: maker, gasLimit: gasLimit});

        // To remove when implementation is complete
        await coin.transfer(channel.address, amount, {from: account0, gasLimit: gasLimit});
        await coin.transfer(channel.address, amount, {from: account0, gasLimit: gasLimit});

        //Open and close channel don't update Market.currentPay*ChannelByDelegate[delegate] -> will fail
        currentPaymentChannel = await market.currentPaymentChannelByDelegate(marketId, consumerDelegate);
        currentPayingChannel = await market.currentPayingChannelByDelegate(marketId, providerDelegate);
        assert.equal(currentPaymentChannel, channelIdPayment, "Channel payment doesn't match.");
        assert.equal(currentPayingChannel, channelIdPaying, "Channel paying doesn't match.");

        // Close channels
        await channel.closeChannel(channelIdPaying, 1, refund_, true, eth_util.toBuffer("0xbaad"), eth_util.toBuffer("0xcafe"),
            {from: maker, gasLimit: gasLimit});
        await channel.closeChannel(channelIdPayment, 1, refund_, true, eth_util.toBuffer("0xbaad"), eth_util.toBuffer("0xbeef"),
            {from: maker, gasLimit: gasLimit});

        currentPaymentChannel = await market.currentPaymentChannelByDelegate(marketId, consumerDelegate);
        currentPayingChannel = await market.currentPayingChannelByDelegate(marketId, providerDelegate);
        assert.ok(currentPaymentChannel, addressNull, "Channel payment found but was closed.");
        assert.ok(currentPayingChannel, addressNull, "Channel paying found but was closed.");
    });

});

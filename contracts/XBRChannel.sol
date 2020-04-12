///////////////////////////////////////////////////////////////////////////////
//
//  Copyright (C) 2018-2020 Crossbar.io Technologies GmbH and contributors.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
///////////////////////////////////////////////////////////////////////////////

pragma solidity ^0.5.12;
pragma experimental ABIEncoderV2;

// https://openzeppelin.org/api/docs/math_SafeMath.html
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// https://openzeppelin.org/api/docs/cryptography_ECDSA.html
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./XBRMaintained.sol";
import "./XBRTypes.sol";
import "./XBRToken.sol";
import "./XBRNetwork.sol";
import "./XBRMarket.sol";


/**
 * XBR Payment/Paying Channel between a XBR data consumer and the XBR market maker,
 * or the XBR Market Maker and a XBR data provider.
 */
contract XBRChannel is XBRMaintained {

    // Add safe math functions to uint256 using SafeMath lib from OpenZeppelin
    using SafeMath for uint256;

    // Add recover method for bytes32 using ECDSA lib from OpenZeppelin
    using ECDSA for bytes32;

    /// Event emittedd when a new XBR data market has opened.
    event Opened(XBRTypes.ChannelType ctype, bytes16 indexed marketId, bytes16 indexed channelId, address actor,
        address delegate, address marketmaker, address recipient, uint256 amount, bytes signature);

    /**
     * Event emitted when payment channel is closing (that is, one of the two state channel
     * participants has called "close()", initiating start of the channel timeout).
     */
    event Closing(XBRTypes.ChannelType ctype, bytes16 indexed marketId, bytes16 indexed channelId,
        uint256 payout, uint256 fee, uint256 refund, uint256 timeoutAt);

    /**
     * Event emitted when payment channel has finally closed, which happens after both state
     * channel participants have called close(), agreeing on last state, or after the timeout
     * at latest - in case the second participant doesn't react within timeout)
     */
    event Closed(XBRTypes.ChannelType ctype, bytes16 indexed marketId, bytes16 indexed channelId,
        uint256 payout, uint256 fee, uint256 refund, uint256 closedAt);

    /// Instance of XBRMarket contract this contract is linked to.
    XBRMarket public market;

    /// Created channels are sequence numbered using this counter (to allow deterministic collision-free IDs for channels)
    uint32 private channelSeq = 1;

    /// Table of all XBR Channels.
    mapping(bytes16 => XBRTypes.Channel) public channels;

    /// Table of all XBR Channel closing states.
    mapping(bytes16 => XBRTypes.ChannelClosingState) public channelClosingStates;

    /// Constructor for this contract, only called once (when deploying the network).
    ///
    /// @param marketAdr The XBR markets contract this instance is associated with.
    constructor (address marketAdr) public {
        market = XBRMarket(marketAdr);
    }

    /// Open a new XBR payment/paying channel for processing off-chain micro-transactions.
    ///
    /// @param ctype Channel type: payment or paying channel.
    /// @param openedAt Block number when the channel opening signature was created.
    /// @param marketId The ID of the XBR market this channel is associated with.
    /// @param channelId The ID of the new XBR channel (must be unique).
    /// @param actor The actor (buyer/seller in the market) that opened this channel.
    /// @param delegate The delegate (off-chain) allowed to spend/earn-on this channel (off-chain)
    ///  in the name of the actor (buyer/seller in the market).
    /// @param marketmaker The off-chain market maker executing the channel.
    /// @param recipient The receiver (on-chain) of the channel payout.
    /// @param amount The amount initially transfered to and held in the channel until closed.
    /// @param signature EIP712 signature, signed by the member.
    function openChannel (XBRTypes.ChannelType ctype, uint256 openedAt, bytes16 marketId, bytes16 channelId,
        address actor, address delegate, address marketmaker, address recipient, uint256 amount,
        bytes memory signature) public {

        // market must exist
        require(market.getMarketOwner(marketId) != address(0), "NO_SUCH_MARKET");

        // channel must not yet exist
        require(channels[channelId].actor == address(0), "INVALID_CHANNEL_ALREADY_EXISTS");

        // the actor (buyer/seller in the market) must be a registered member
        (, , , XBRTypes.MemberLevel actor_member_level, ) = market.network().members(actor);
        require(actor_member_level == XBRTypes.MemberLevel.ACTIVE ||
                actor_member_level == XBRTypes.MemberLevel.VERIFIED, "INVALID_CHANNEL_ACTOR");

        // must provide a valid delegate address, but the delegate doesn't need to be member!
        require(delegate != address(0), "INVALID_CHANNEL_DELEGATE");

        // must provide a valid marketmaker address: this must be the market maker set in the market!
        require(marketmaker == market.getMarketMaker(marketId), "INVALID_CHANNEL_MARKETMAKER");

        // the recepient must be a registered member
        (, , , XBRTypes.MemberLevel recipient_member_level, ) = market.network().members(recipient);
        require(recipient_member_level == XBRTypes.MemberLevel.ACTIVE ||
                recipient_member_level == XBRTypes.MemberLevel.VERIFIED, "INVALID_CHANNEL_RECIPIENT");

        if (ctype == XBRTypes.ChannelType.PAYMENT) {
            // transaction sender must be a market buyer-actor or the market-maker (the piece of running software for the market)
            require(msg.sender == market.getMarketMaker(marketId) ||
                    msg.sender == actor, "SENDER_NOT_MARKETMAKER_OR_BUYER");

            // actor must be consumer in the market
            require(market.isActor(marketId, actor, XBRTypes.ActorType.CONSUMER) ||
                    market.isActor(marketId, actor, XBRTypes.ActorType.PROVIDER_CONSUMER), "ACTOR_NOT_CONSUMER");

            // technical recipient of the unidirectional, half-legged channel must be the owner (operator) of the market
            require(recipient == market.getMarketOwner(marketId), "RECIPIENT_NOT_MARKET");


        } else if (ctype == XBRTypes.ChannelType.PAYING) {
            // transaction sender must be the market-owner (aka market-operator) or the market-maker (the piece of running software for the market)
            require(msg.sender == market.getMarketMaker(marketId) ||
                    msg.sender == market.getMarketOwner(marketId), "SENDER_NOT_MARKETMAKER_OR_OWNER");

            // actor must be provider in the market
            require(market.isActor(marketId, actor, XBRTypes.ActorType.PROVIDER) ||
                    market.isActor(marketId, actor, XBRTypes.ActorType.PROVIDER_CONSUMER), "ACTOR_NOT_PROVIDER");

            // technical recipient of the unidirectional, half-legged channel must be a provider (seller) in the market
            require(recipient == actor, "RECIPIENT_NOT_ACTOR");

        } else {
            require(false, "INVALID_CHANNEL_TYPE");
        }

        // signature must have been created in a window of 5 blocks from the current one
        require(openedAt <= block.number && openedAt >= (block.number - 4), "INVALID_REGISTERED_BLOCK_NUMBER");

        ERC20 coin = market.getMarketToken(marketId);

        // payment channel amount must be positive
        require(amount > 0 && amount <= coin.totalSupply(), "INVALID_CHANNEL_AMOUNT");

        // the data used to open the new channel must have a valid signature, signed by the
        // actor (buyer/seller in the market)
        XBRTypes.EIP712ChannelOpen memory eip712_obj = XBRTypes.EIP712ChannelOpen(market.network().verifyingChain(),
            market.network().verifyingContract(), uint8(ctype), openedAt, marketId, channelId,
            actor, delegate, marketmaker, recipient, amount);
        require(XBRTypes.verify(actor, eip712_obj, signature), "INVALID_CHANNEL_SIGNATURE");

        // Everything is OK! Continue actually opening the channel ..

        // Only consumer transfers token to channel. Tokens will stay here until close paying channel.
        if (ctype == XBRTypes.ChannelType.PAYMENT) {
            require(coin.transferFrom(actor, address(this), amount), "CHANNEL_OPEN_AMOUNT_TRANSFER_FAILED");
        }

        // track channel static information
        channels[channelId] = XBRTypes.Channel(openedAt, channelSeq, ctype, marketId, channelId, actor,
            delegate, marketmaker, recipient, amount, signature);

        // track channel closing (== modifiable) information
        channelClosingStates[channelId] = XBRTypes.ChannelClosingState(XBRTypes.ChannelState.OPEN,
            0, 0, 0, 0, 0, 0, "", "");

        // increment channel sequence for next channel
        channelSeq = channelSeq + 1;

        // notify observers (eg a dormant market maker waiting to be associated)
        emit Opened(ctype, marketId, channelId, actor, delegate, marketmaker, recipient, amount, signature);
    }

    /**
     * Trigger closing this payment channel. When the first participant has called `close()`
     * submitting its latest transaction/state, a timeout period begins during which the
     * other party of the payment channel has to submit its latest transaction/state too.
     * When both transaction have been submitted, and the submitted transactions/states agree,
     * the channel immediately closes, and the consumed amount of token in the channel is
     * transferred to the channel recipient, and the remaining amount of token is transferred
     * back to the original sender.
     */
    function closeChannel (bytes16 channelId, uint32 closingChannelSeq, uint256 balance, bool isFinal,
        bytes memory delegateSignature, bytes memory marketmakerSignature) public {

        // channel must exist
        require(channels[channelId].actor != address(0), "NO_SUCH_CHANNEL");

        // this should not happen if above succeeds, but better be paranoid
        require(channelClosingStates[channelId].state != XBRTypes.ChannelState.NULL, "NO_SUCH_CHANNEL");

        // channel must be in correct state (OPEN or CLOSING)
        require(channelClosingStates[channelId].state == XBRTypes.ChannelState.OPEN ||
                channelClosingStates[channelId].state == XBRTypes.ChannelState.CLOSING, "CHANNEL_NOT_OPEN");

        // check delegate signature
        require(XBRTypes.verify(channels[channelId].delegate, XBRTypes.EIP712ChannelClose(market.network().verifyingChain(),
            market.network().verifyingContract(), channels[channelId].marketId, channelId, closingChannelSeq,
            balance, isFinal), delegateSignature), "INVALID_DELEGATE_SIGNATURE");

        // check market maker signature
        require(XBRTypes.verify(channels[channelId].marketmaker, XBRTypes.EIP712ChannelClose(market.network().verifyingChain(),
            market.network().verifyingContract(), channels[channelId].marketId, channelId, closingChannelSeq,
            balance, isFinal), marketmakerSignature), "INVALID_MARKETMAKER_SIGNATURE");

        // closing (off-chain) balance must be valid
        require(0 <= balance && balance <= channels[channelId].amount, "INVALID_CLOSING_BALANCE");

        // closing (off-chain) sequence must be valid
        require(closingChannelSeq >= 1, "INVALID_CLOSING_SEQ");

        // if the channel is already closing ..
        if (channelClosingStates[channelId].state == XBRTypes.ChannelState.CLOSING) {
            // the channel must not yet be timed out
            require(channelClosingStates[channelId].closedAt == 0, "INTERNAL_ERROR_CLOSED_AT_NONZERO");
            require(block.timestamp < channelClosingStates[channelId].closingAt, "CHANNEL_TIMEOUT"); // solhint-disable-line

            // the submitted transaction must be more recent
            require(channelClosingStates[channelId].closingSeq < closingChannelSeq, "OUTDATED_TRANSACTION");
        }

        ChannelType ctype = channels[channelId].ctype;

        // the amount earned (by the recipient) is initial channel amount minus last off-chain balance
        uint256 earned = (channels[channelId].amount - balance);

        // the remaining amount (send back to the buyer) via the last off-chain balance
        uint256 refund = 0;
        if (ctype == XBRTypes.ChannelType.PAYMENT) {
            refund = balance;
        }

        // the amount paid out to the provider only
        uint payout = 0;
        // apply fee only one time : in paying channel
        uint256 feeOrganization = 0;
        uint256 feeMarket = 0;
        if (ctype == XBRTypes.ChannelType.PAYING) {
            // the fee to the xbr network is 1% of the earned amount
            feeOrganization = earned / 100;
            feeMarket = (earned - feeOrganization) * market.getMarketFee(marketId) / 100;
            payout = earned - feeOrganization - feeMarket;
        }

        // FIXME: read from market configuration
        // uint32 timeout = 1440;

        // if we got a newer closing transaction, process it ..
        if (closingChannelSeq > channelClosingStates[channelId].closingSeq) {

            // the closing balance of a newer transaction must be not greater than anyone we already know
            if (channelClosingStates[channelId].closingSeq > 0) {
                require(balance <= channelClosingStates[channelId].closingBalance, "TRANSACTION_BALANCE_OUTDATED");
            }

            // note the closing transaction sequence number and closing off-chain balance
            channelClosingStates[channelId].state = XBRTypes.ChannelState.CLOSING;
            channelClosingStates[channelId].closingSeq = closingChannelSeq;
            channelClosingStates[channelId].closingBalance = balance;

            // note the new channel closing date
            channelClosingStates[channelId].closingAt = block.timestamp + 1440; // solhint-disable-line

            // notify channel observers
            emit Closing(channels[channelId].ctype, channels[channelId].marketId, channelId,
                payout, fee, refund, block.timestamp + 1440);
        }

        // finally close the channel ..
        if (isFinal || balance == 0 ||
            (channelClosingStates[channelId].state == XBRTypes.ChannelState.CLOSING && block.timestamp >= channelClosingStates[channelId].closingAt)) { // solhint-disable-line

            // now send tokens locked in this channel (which escrows the tokens) to the recipient,
            // the xbr network (for the network fee), and refund remaining tokens to the original sender
            ERC20 coin = market.getMarketToken(marketId);

            if (payout > 0) {
                require(coin.transfer(channels[channelId].recipient, payout), "CHANNEL_CLOSE_PAYOUT_TRANSFER_FAILED");
            }

            if (refund > 0) {
                require(coin.transfer(channels[channelId].actor, refund), "CHANNEL_CLOSE_REFUND_TRANSFER_FAILED");
            }

            if (feeOrganization > 0) {
                require(coin.transfer(market.network().organization(), feeOrganization), "CHANNEL_CLOSE_FEE_ORGANISATION_TRANSFER_FAILED");
            }

            if (feeMarket > 0) {
                require(coin.transfer(market.getMarketOwner(marketId), feeMarket), "CHANNEL_CLOSE_FEE_MARKET_TRANSFER_FAILED");
            }

            // mark channel as closed (but do not selfdestruct)
            channelClosingStates[channelId].closedAt = block.timestamp; // solhint-disable-line
            channelClosingStates[channelId].state = XBRTypes.ChannelState.CLOSED;

            // notify channel observers
            uint256 fee = feeOrganization + feeMarket;
            emit Closed(channels[channelId].ctype, channels[channelId].marketId, channelId,
                payout, fee, refund, block.timestamp);
        }
    }
}

# Transaction costs

```
truffle test test/06_gasconsumption.js --network ganache
```

## Output:

```
Using network 'ganache'.


Compiling your contracts...
===========================
> Compiling ./contracts/XBRMarket.sol
> Compilation warnings encountered:

    /home/albertk/proj/xbr_2020/02_MVP/xbr-protocol/contracts/XBRTypes.sol:20:1: Warning: Experimental features are turned on. Do not use experimental features on live deployments.
pragma experimental ABIEncoderV2;
^-------------------------------^
,/home/albertk/proj/xbr_2020/02_MVP/xbr-protocol/contracts/XBRNetwork.sol:20:1: Warning: Experimental features are turned on. Do not use experimental features on live deployments.
pragma experimental ABIEncoderV2;
^-------------------------------^
,/home/albertk/proj/xbr_2020/02_MVP/xbr-protocol/contracts/XBRMarket.sol:20:1: Warning: Experimental features are turned on. Do not use experimental features on live deployments.
pragma experimental ABIEncoderV2;
^-------------------------------^


Deploying contracts from 0x4e427224DFdF5a6C7011fD5981fdce487B7958B6 with gas 10000000 ..
>>>> XBRToken deployed at 0x7D162d94A1593D9e069AdfD0f681259443A3BB4A
>>>> XBRTypes deployed at 0xA7263a9a41b028e1753CC77b12a42117CA8Df6c2
>>>> XBRNetwork deployed at 0xd0C07dC0a1eb23b743cFE9e6C50A2A33A2f53672
>>>> XBRMarket deployed at 0x095B5B3c75362dE8621B0E7096955DC61Eb1F2d3

Deployed XBR contract addresses:

export XBR_DEBUG_TOKEN_ADDR=0x7D162d94A1593D9e069AdfD0f681259443A3BB4A
export XBR_DEBUG_NETWORK_ADDR=0xd0C07dC0a1eb23b743cFE9e6C50A2A33A2f53672
export XBR_DEBUG_MARKET_ADDR=0x095B5B3c75362dE8621B0E7096955DC61Eb1F2d3

^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^



  Contract: XBRToken
current gasprice is: 0.000025217000000000003 Euro
transaction costs 1.289193908 Euro
    1) XBRToken gas consumption: token transfer

    Events emitted during test:
    ---------------------------

    IERC20.Transfer(
      from: <indexed> 0x4e427224DFdF5a6C7011fD5981fdce487B7958B6 (type: address),
      to: <indexed> 0x2397F4Fe7454637B06B4DF214712b6A8Ff8edcce (type: address),
      value: 1001 (type: uint256)
    )

    IERC20.Transfer(
      from: <indexed> 0x4e427224DFdF5a6C7011fD5981fdce487B7958B6 (type: address),
      to: <indexed> 0xBDF70136DfC45D43877C5b6de191361F9D3BB94F (type: address),
      value: 1002 (type: uint256)
    )


    ---------------------------

  Contract: XBRNetwork
current gasprice is: 0.000025217000000000003 Euro
Using XBRNetwork         : 0xd0C07dC0a1eb23b743cFE9e6C50A2A33A2f53672
Using XBRToken           : 0x7D162d94A1593D9e069AdfD0f681259443A3BB4A
Using XBRMarket          : 0x095B5B3c75362dE8621B0E7096955DC61Eb1F2d3
register costs are: 3.4470630320000004 Euro
    2) Actor Buyer/Seller/Operator: Registration costs:
    > No events were emitted
create market costs are: 6.943273997 Euro
    3) Actor Operator: Create Market costs:
    > No events were emitted
join market costs: 3.3248110160000004 Euro
    4) Actor Buyer/Seller: Join Market costs:
    > No events were emitted
open market costs: 30.764487830000004 Euro
    5) Actor Buyer: Open Buyer Channel costs:
    > No events were emitted
Open Seller Channel costs 30.681069994000005 Euro
    6) Actor Seller: Open Seller Channel costs: 
    > No events were emitted


  0 passing (2s)
  6 failing

  1) Contract: XBRToken
       XBRToken gas consumption: token transfer:
     AssertionError: transaction to expensive -> 1.289193908 Euro
      at Context.it (test/06_gasconsumption.js:39:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  2) Contract: XBRNetwork
       Actor Buyer/Seller/Operator: Registration costs::
     AssertionError: registration to expensive -> 3.4470630320000004 Euro
      at Context.it (test/06_gasconsumption.js:119:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  3) Contract: XBRNetwork
       Actor Operator: Create Market costs::
     AssertionError: create market to expensive -> 6.943273997 Euro
      at Context.it (test/06_gasconsumption.js:125:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  4) Contract: XBRNetwork
       Actor Buyer/Seller: Join Market costs::
     AssertionError: join market to expensive -> 3.3248110160000004 Euro
      at Context.it (test/06_gasconsumption.js:131:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  5) Contract: XBRNetwork
       Actor Buyer: Open Buyer Channel costs::
     AssertionError: join market to expensive -> 30.764487830000004 Euro
      at Context.it (test/06_gasconsumption.js:137:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  6) Contract: XBRNetwork
       Actor Seller: Open Seller Channel costs: :
     AssertionError: Open Seller Channel to expensive -> 30.681069994000005 Euro
      at Context.it (test/06_gasconsumption.js:143:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)
```

Test 13.03.2020

```
  Contract: XBRNetwork
current gasprice is: 0.00000334 Euro
Using XBRNetwork         : 0x6aCa81d2F5837431AE2b55076a25B97a9Cb7c1BA
Using XBRToken           : 0x248a7E1bc2afee346F70aBC3b91762435E923BE9
Using XBRMarket          : 0x348bDA61234344Dd535f4c002682385b5585984d
register costs are: 0.45656464 Euro
    2) Actor Buyer/Seller/Operator: Registration costs:
    > No events were emitted
create market costs are: 0.91963894 Euro
    3) Actor Operator: Create Market costs:
    > No events were emitted
join market costs: 0.44037232000000004 Euro
    4) Actor Buyer/Seller: Join Market costs:
    > No events were emitted
open market costs: 4.0747666 Euro
    5) Actor Buyer: Open Buyer Channel costs:
    > No events were emitted
Open Seller Channel costs 4.0637178800000004 Euro
    6) Actor Seller: Open Seller Channel costs: 
    > No events were emitted


  0 passing (2s)
  6 failing

  1) Contract: XBRToken
       XBRToken gas consumption: token transfer:
     AssertionError: transaction to expensive -> 0.17075416000000002 Euro
      at Context.it (test/06_gasconsumption.js:39:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  2) Contract: XBRNetwork
       Actor Buyer/Seller/Operator: Registration costs::
     AssertionError: registration to expensive -> 0.45656464 Euro
      at Context.it (test/06_gasconsumption.js:119:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  3) Contract: XBRNetwork
       Actor Operator: Create Market costs::
     AssertionError: create market to expensive -> 0.91963894 Euro
      at Context.it (test/06_gasconsumption.js:125:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  4) Contract: XBRNetwork
       Actor Buyer/Seller: Join Market costs::
     AssertionError: join market to expensive -> 0.44037232000000004 Euro
      at Context.it (test/06_gasconsumption.js:131:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  5) Contract: XBRNetwork
       Actor Buyer: Open Buyer Channel costs::
     AssertionError: join market to expensive -> 4.0747666 Euro
      at Context.it (test/06_gasconsumption.js:137:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  6) Contract: XBRNetwork
       Actor Seller: Open Seller Channel costs: :
     AssertionError: Open Seller Channel to expensive -> 4.0637178800000004 Euro
      at Context.it (test/06_gasconsumption.js:143:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)
```
# Transaction costs

```
truffle test test/06_gasconsumption.js --network ganache
```

## Output:

```
current gasprice is: 0.00002505 Euro
Using XBRNetwork         : 0x4d3cF689B9D8DC1Ea2F8B244D53DCd2eDfefeB57
Using XBRToken           : 0xcE742975f2cAb3F63e7Cc3a2d1969F009DC20deD
Using XBRMarket          : 0x6Efec57D1DD596CBfcD937Ffefab9881900FE1B4
register costs are: 3.4242348 Euro
    2) Registration costs:
    > No events were emitted
create market costs are: 6.89729205 Euro
    3) Create Market costs:
    > No events were emitted
join market costs: 3.3027924 Euro
    4) Join Market costs:
    > No events were emitted
open market costs: 30.5607495 Euro
    5) Open Buyer Channel costs:
    > No events were emitted
Open Seller Channel costs 30.477884099999997 Euro
    6) Open Seller Channel costs: 
    > No events were emitted


  0 passing (2s)
  6 failing

  1) Contract: XBRToken
       XBRToken gas consumption: token transfer:
     AssertionError: transaction to expensive -> 1.2806562 Euro
      at Context.it (test/06_gasconsumption.js:39:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  2) Contract: XBRNetwork
       Registration costs::
     AssertionError: registration to expensive -> 3.4242348 Euro
      at Context.it (test/06_gasconsumption.js:119:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  3) Contract: XBRNetwork
       Create Market costs::
     AssertionError: create market to expensive -> 6.89729205 Euro
      at Context.it (test/06_gasconsumption.js:125:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  4) Contract: XBRNetwork
       Join Market costs::
     AssertionError: join market to expensive -> 3.3027924 Euro
      at Context.it (test/06_gasconsumption.js:131:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  5) Contract: XBRNetwork
       Open Buyer Channel costs::
     AssertionError: join market to expensive -> 30.5607495 Euro
      at Context.it (test/06_gasconsumption.js:137:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)

  6) Contract: XBRNetwork
       Open Seller Channel costs: :
     AssertionError: Open Seller Channel to expensive -> 30.477884099999997 Euro
      at Context.it (test/06_gasconsumption.js:143:9)
      at process._tickCallback (internal/process/next_tick.js:68:7)
```

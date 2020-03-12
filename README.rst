The XBR Protocol
================

**Test transaction costs**

```
truffle test test/06_gasconsumption.js --network ganache
```
Output:

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


|Travis| |Coverage| |Docs (on CDN)| |Docs (on S3)|

The **XBR Protocol** enables secure peer-to-peer data-trading and -service microtransactions in
`Open Data Markets <https://xbr.network>`__ between multiple independent entities.

XBR as a protocol sits on top of `WAMP <https://wamp-proto.org>`__, an open messaging middleware and service mesh technology,
and enables secure integration, trusted sharing and monetization of data and data-driven microservices
between different parties and users.

The XBR Protocol specification is openly developed and freely usable.

The protocol is implemented in *smart contracts* written in `Solidity <https://solidity.readthedocs.io>`__
and open-source licensed (`Apache 2.0 <https://github.com/crossbario/xbr-protocol/blob/master/LICENSE>`__).
Smart contracts are designed to run on the `Ethereum blockchain <https://ethereum.org/>`__.
All source code for the XBR smart contracts is developed and hosted in the
project main `GitHub repository <https://github.com/crossbario/xbr-protocol>`__.

The XBR Protocol and reference documentation can be found `here <https://s3.eu-central-1.amazonaws.com/xbr.foundation/docs/protocol/index.html>`__.

**Application development with XBR**

The XBR smart contracts primary build artifacts are the `contract ABIs JSON files <https://github.com/crossbario/xbr-protocol/tree/master/abi>`__.
The ABI files are built during compiling the `contract sources <https://github.com/crossbario/xbr-protocol/tree/master/contracts>`__.
Technically, the ABI files are all you need to interact and talk to the XBR smart contracts deployed to a blockchain
from any (client side) language or run-time that supports Ethereum, such as
`web3.js <https://web3js.readthedocs.io>`__ or `web3.py <https://web3py.readthedocs.io>`__.

However, this approach (using the raw XBR ABI files directly from a "generic" Ethereum client library) can be cumbersome
and error prone to maintain. An alternative way is using a client library with built-in XBR support.

The XBR project currently maintains the following **XBR-enabled client libraries**:

-  `Autobahn|Python <https://github.com/crossbario/autobahn-python>`__ for Python 3.5+
-  `Autobahn|JavaScript <https://github.com/crossbario/autobahn-js>`__ for JavaScript, in browser and NodeJS
-  `Autobahn|Java <https://github.com/crossbario/autobahn-java>`__ (*beta XBR support*) for Java on Android and Java 8 / Netty
-  `Autobahn|C++ <https://github.com/crossbario/autobahn-cpp>`__ (*XBR support planned*) for C++ 11+ and Boost/ASIO

XBR support can be added to any `WAMP client library <https://wamp-proto.org/implementations.html#libraries>`__
with a language run-time that has packages for Ethereum application development.

.. |Docs (on CDN)| image:: https://img.shields.io/badge/docs-cdn-brightgreen.svg?style=flat
   :target: https://xbr.network/docs/protocol/index.html
.. |Docs (on S3)| image:: https://img.shields.io/badge/docs-s3-brightgreen.svg?style=flat
   :target: https://s3.eu-central-1.amazonaws.com/xbr.foundation/docs/protocol/index.html
.. |Travis| image:: https://travis-ci.org/crossbario/xbr-protocol.svg?branch=master
   :target: https://travis-ci.org/crossbario/xbr-protocol
.. |Coverage| image:: https://img.shields.io/codecov/c/github/crossbario/xbr-protocol/master.svg
   :target: https://codecov.io/github/crossbario/xbr-protocol

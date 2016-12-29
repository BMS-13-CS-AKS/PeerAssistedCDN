# Peer Assisted Content Delivery

## Description

Extending the traditional centralised content delivery used in websites with a p2p network.


## Installation

Make sure node.js is installed
Note : These instructions are only for hosting the test site.

#### Run the signaling server:

In a new terminal:

```bash
cd [pathtorepos]/PeerAssistedCDN/server
npm install # Need not be done if already installed deps
node signaling.js
```

#### To host the example site:

In a new terminal

Make sure node-static is installed:

```bash
npm install -g node-static # Need not be one of already installed
```

host the files:

```bash
cd [pathtorepos]/PeerAssistedCDN/site
static -a 0.0.0.0
```

## [Get up to date on the progress](https://github.com/BMS-13-CS-AKS/PeerAssistedCDN/wiki/Overview-For-Contributers)

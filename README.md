# Peer Assisted Content Delivery

## Description

Extending the traditional centralised content delivery used in websites with a p2p network.


## Installation

Make sure node.js is installed
Install browserify globally
```sh
  $ npm install -g browserify
```
Note : These instructions are only for hosting the test site.

#### Run the signaling server:

In a new terminal:

```sh
cd [pathtorepos]/PeerAssistedCDN/server
npm install # Need not be done if already installed deps
node signaling.js
```

#### To host the example site:

In a new terminal
Update the asgard.js file ( Should be done for every change to Torrent ):
```sh
npm build
```
Make sure node-static is installed: 

```sh
npm install -g node-static # Need not be one of already installed
```

host the files:

```sh
cd [pathtorepos]/PeerAssistedCDN/site
static -a 0.0.0.0
```

## [Get up to date on the progress](https://github.com/BMS-13-CS-AKS/PeerAssistedCDN/wiki/Overview-For-Contributers)

# Peer Assisted Content Delivery

#### [WebRTC explained](https://github.com/BMS-13-CS-AKS/PeerAssistedCDN/blob/master/site/webRTC.md)

## Try out the example site
Make sure node.js is installed
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

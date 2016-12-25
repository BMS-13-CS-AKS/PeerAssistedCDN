# Peer Assisted Content Delivery

Make sure node.js is installed
#### Run the signaling server:

Open a new terminal
Change directory to server,then:

```bash
cd PeerAssistedCDN/server
node signaling.js
```

#### To host the test site:

Open a new terminal
Install node-static:

```bash
npm install -g node-static
```

Change directory to PeerAssistedCDN/site,then run

```bash
cd PeerAssistedCDN/site
static -a 0.0.0.0
```

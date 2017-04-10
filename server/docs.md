## signaling_new.js API

### `wss.on('connection', function(connection)`

receives `connection` object on connection event

### `connection.on('message', callback(message))`

receives `message` from connection on message event

### `onOffer()`

sends offer from one user to other

### `onAnswer()`

receiver sends answer to sender

### `onCandidate()`

sends candidate information from one peer to other

### `onLeave()`

displays information about disconnecting peer

### `onRequest()`

sends information about the requested infoHash

### `onSeed()`

adds itself as a seed for specific infoHash

### `addNewPeer(peer, connection)`

add new peer with name `peer` and connection object `connection` to the users dictionary

### `removePeer(name)`

removes peer with name `name` from the users dictionary

###  `removePeerFromInfoHash(infoHash, peer)`

removes peer with peername `peer` from the infohash `infohash` in the users and trackers dictionary

### `getPeers(infoHash)`

returns peers who are currently seeding file with information hash `infoHash`

### `showInfo()`

functions that displays the terminal User Interface



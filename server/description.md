# Signaling/Tracker(ST) Server

Our ST server will be a websocket server.
Each peer will establish a websocket connection with the ST server.
Connections will persist as long as the tab is open, if it is told to be closed by the server.

### Functions of our signaling/tracker server:

#### Checking ID uniquesness

This simply involves making sure no 2 peers have the same peer ID.

#### Signaling Server

Peers will signal other peers via our server.The ST server is responsible for relaying data to the correct peer.
The signals supported are:
- offer
- candidate
- answer

#### Store infohashes

The ST server will have a database containing infohashes.

#### Peer tracking

For each infohash our peer should maintain a list of peers.
These peers can be further categorised based on the status of their download ( complete or incomplete ).

Our tracker must:
 - remove a peer from a given infohash when they disconnect.
 - remove a peer from a given infohash if they havent announced for a period of time.Alternatively,we could check if the peer is still alive by pinging it with a message.

#### Handling peer requests

Peers can send a request or an initial Ola message.

The tracker will then send an appropriate response.

- ##### Tracker Ola:
  This is for the peer to capture an ID.The peer will send a message containing the peer ID it generated.The tracker should respond with a success or failure message.

- #####  Tracker request format:

  A request to the tracker contains the following fields:
  - info_hash
  - uploaded (optional)
  - downloaded (optional)
  - left (optional)
  - event
    - started
    - completed
    - stopped
  - num_want (optional, defaults to 20)

  You can compare these with the original bittorrent specs.
  https://wiki.theory.org/BitTorrentSpecification#Tracker_HTTP.2FHTTPS_Protocol

  Few of the fields have been ommitted since they are not required with websockets.

- ##### Tracker response format:

  TODO

#### Issues
  Here are a few issues that we need to address.
   - Large number of requests from a peer.Handle with `interval`.
   - Large number of signals from a peer or to a specific peer.
   - Large number of active websocket connections. We can address this by only keeping connections that are needed in case of overload i.e maintaining just enough seeders for a given amount of leechers.
   - DDOS.Might be out of our scope but we should still atleast research a little.

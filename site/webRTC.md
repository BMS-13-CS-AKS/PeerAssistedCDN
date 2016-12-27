# webRTC

## Introduction

In our project we use webRTC to connect to other peers.Many online tutorials demonstrate webRTC inside one tab itself(remote peer and local peer in one tab).I was not very happy with this and spent a lot of time in learning to implement a working data channel.So,I didn't want you guys to waste time too.

In Bittorrent we only need the ips and port of other peers to establish communication with them.In webRTC,to establish a connection we initially need to exchange descriptions with the remote peer.The signaling server acts as a relay to help us exchange these messages.So in order to establish a connection we need both peers to be connected to the server at the same time.

While connecting to other peers(without webRTC),we encounter the NAT traversal problem.We would have to resort to some NAT traversal technique to establish a connection.webRTC facilitates NAT traversal using ICE protocol and makes life much easier.

## Interactive Connectivity Establishment(ICE)

There are many techniques on traversing NATs,but no one technique is good in all scenarios.webRTC combines two,STUN and TURN, to find the optimal connection.STUN is used to find our public ip address and port.TURN is our last resort option where we relay data across a TURN server to the other peer.Obviously,TURN is resource intensive,so we would rather have a direct p2p connection.

When we want to establish our connection webRTC will start generating ICE candidates(through STUN servers).These candidates are tuples of ip,port,protocol and as these candidates are generated we signal them to the other side.Now I dont know how,but webRTC will use these candidates and try to establish a connection.If not able to create a direct channel it will use TURN.

For a better explanation:
https://webrtchacks.com/trickle-ice/

Note:In our project we will not use TURN servers.

## Signaling

For our signaling server we use a websocket server.This gives a bidirectional channel from the server to a client.So the server can send messages as he likes whenever he wants(as opposed to HTTP).

There are three signals we want to send to the other siiide:

- offer
- answer
- ICE candidates

Let us take a scenario where **peer1** wants to connect to **peer2**.

Assume their id's are **peer1** and **peer2** itself.Signaling involves exchanging SDP(Session Description Protocol) messages.We don't need to understand the contents of the message for now.

Note: Both peers will create a webRTC connection object,with some initial config, before offering/accepting a connection.They will then add stuff to this object as they receive signals to establish connection.The initial config can include the STUN and TURN urls to be used.

**peer1** creates a webRTC connection object.

**peer1** will create an offer message that contains his local description **LD1** .He will then tell webRTC that **LD1** is his local description.This offer message is then sent to the signaling server along with the id **peer2**.

The server sees that it is intended for **peer2** and sends it to her.

**peer2** (should she choose to accept it) will receive it and create a new webRTC object. She will then tell her webRTC connection that **LD1** is the remote description for this connection.

She then creates an answer with her local descrption **LD2** and sends it to **peer1** through the signaling channel.She also tells webRTC that her connection is **LD2**.

**peer1** will receive the answer and tell webRTC that the remote description is **LD2**.

During this each webRTC object will generate ICE candidates which should be sent to the other side.The other side will get this and just give it to its own webRTC object.

## Data Channel

Creating a data channel is easy.Only one person needs to make a data channel object.The other should just catch this object.

So the person who offers can create a data channel object(Can be done before signaling) with the required config.The other peer should create an event handler to catch the **ondatachannnel** event.


Read through my heavily commented [client example](https://github.com/BMS-13-CS-AKS/PeerAssistedCDN/blob/master/site/client.js).My **peerChannel** prototype is based off of this so make sure to understand it well.

# Peer Assisted Content Delivery

## Description

Extending the traditional centralised content delivery used in websites with a p2p network.


## Installation


### Requirements

Ubuntu 14.04 or greater version 

### Install nodejs 

```sh
    $ https://deb.nodesource.com/setup_7.x | sudo -E bash -
    $ sudo apt-get install -y nodejs
  ```
#### Install browserify

```sh
  $ npm install -g browserify
```
  
### Run the signaling server:

```sh
  $ cd [pathtorepos]/PeerAssistedCDN/server
  $ npm install 
  $ node signalling_new.js
```

### Build torrent

```sh
  $ cd Torrent
  $ npm install
  $ npm run build
```

### Build client software

```sh
  $ cd client
  $ npm run build

```
#### To host the example site:

```sh
  $ cd [pathtorepos]/PeerAssistedCDN/site
  $ npm install 
  $ mkdir test_images ## copy all the images to this folder
  $ node index.js data
```

### Create infohash of images 

``` sh
  $ cd [pathtorepos]/PeerAssistedCDN/site
  $ mkdir test_images
  $ mkdir metaInfo
  $ cd [pathtorepos]/PeerAssistedCDN/infohash-creator
  $ npm run build
```

Then open the browser and type localhost:5000/testsite1

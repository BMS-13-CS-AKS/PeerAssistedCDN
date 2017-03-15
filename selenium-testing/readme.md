## Rough idea
 
- There is a server

- There are clients (5 in our case)

- Server sends commands to clients

- Commands can be things like create torrent , seed, download

- Clients interprets the command and performs the actions

- Actions are performed by selenium 

- Results of actions are sent back to server which can be logged

## Usage

```sh
  $ npm install
  
  #create a server named server.local
  $ node server.js server.local 
  
  #create a client named client1 and connect to server.local
  $ node client.js client1 server.local 
  
  #create a client named client1 and connect to server.local
  $ node client.js client2 server.local 
```

Now, type commands in server's terminal and look at client's terminal 



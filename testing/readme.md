## Mechanism 
 
- There is a server

- There are clients 

- Server sends commands to clients

- Command is of format `{to: clientName, command: noOfBrowsers}` 

- Client interprets the command and performs the action

- Action = Opening specified no. of browser window one after the other 

- Results of actions are sent back to report-server which test script connects to 

## Usage

```sh
  #install all dependencies
  $ npm install

  #builds test script that user embeds into the site
  $ browserify test-script.js -o ../site/scripts/test-script-build.js
  
  #runs report server
  $ node report-server.js 
  
  #create a server named server.local
  $ node server.js server.local 
  
  #create a client named client1 and connect to server.local
  $ node client.js client1 server.local 
  
  #create a client named client1 and connect to server.local
  $ node client.js client2 server.local 
```

Now, type commands in server's terminal and look at client's terminal 

Format of command is `clientName noofBrowserWindows`

## Example

The example below shows giving command from server to the client in the format mentioned above

```sh
 $ node server.js server.local
 client1 8 
 client2 4
```  

  



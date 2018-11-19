var tmi = require('tmi.js')
var settings = require('./settings')

let opts = {
    identity: {
      username: settings.USERNAME,
      password: 'oauth:' + settings.OAUTH_TOKEN
    },
    channels: settings.CHANNELS
}


// Create a client with our options:
let client = new tmi.client(opts)

client.connect()

client.on("connected", function(address, port) {
    console.log("Address: " + address)
})

client.on("message", function onMessageHandler(channel, userstate, msg, self) {
    if (self) {return}
    let username = userstate.username
    let isSubscriber = userstate.subscriber
    let isMod = userstate.mod
    console.log(`${username}: ${msg}`)
})
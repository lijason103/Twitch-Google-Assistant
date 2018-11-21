var tmi = require('tmi.js')
var settings = require('./settings')
var path = require('path')
const GoogleAssistant = require('google-assistant');

// Google Assistant Setup
const config = {
    auth: {
      keyFilePath: path.resolve(__dirname, 'key.json'),
      savedTokensPath: path.resolve(__dirname, 'tokens.json'), // where you want the tokens to be saved
    },
    conversation: {
      lang: 'en-US', // defaults to en-US, but try other ones, it's fun!
    },
};

const assistant = new GoogleAssistant(config.auth);
assistant
    .on('ready', () => console.log("Assistant is ready."))
    .on('error', (error) => {
    console.log('Assistant Error:', error);
    });


// Twitch chat Setup
let opts = {
    identity: {
      username: settings.USERNAME,
      password: 'oauth:' + settings.OAUTH_TOKEN
    },
    channels: settings.CHANNELS
}

let client = new tmi.client(opts)
client.connect()
client.on("connected", function(address, port) {
    console.log("Client connected")
})

const startConversation = (conversation, onResponseCallback) => {
    // setup the conversation
    conversation
    .on('response', text => onResponseCallback(text))
    // if we've requested a volume level change, get the percentage of the new level
    .on('volume-percent', percent => console.log('New Volume Percent:', percent))
    // the device needs to complete an action
    .on('device-action', action => console.log('Device Action:', action))
    // once the conversation is ended, see if we need to follow up
    .on('ended', (error, continueConversation) => {
        if (error) {
        console.log('Conversation Ended Error:', error);
        } else {
        conversation.end();
        }
    })
    // catch any errors
    .on('error', (error) => {
        console.log('Conversation Error:', error);
    });
}

const responseDelayMin = 1000
const responseDelayMax = 3000

client.on("message", function onMessageHandler(channel, userstate, msg, self) {
    if (self) {return}
    let username = userstate.username
    let isSubscriber = userstate.subscriber
    let isMod = userstate.mod
    console.log("=======")
    console.log(`${username}: ${msg}`)
    try{
        config.conversation.textQuery = msg;
        assistant.start(config.conversation, 
            (conversation) => startConversation(conversation, 
                async (response) => {
                    setTimeout(() => {
                        response = sanitizeResponse(response)
                        console.log(response)
                        client.say(settings.CHANNELS[0], response)
                    }, Math.random() * (responseDelayMax - responseDelayMin) + responseDelayMin )
                }
            )
        );
    }catch (error) {
        console.log("error: ", error)
    }
})

sanitizeResponse = (response) => {
    return response.replace('ACTION', "")
}
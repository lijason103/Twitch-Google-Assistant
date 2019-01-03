var tmi = require('tmi.js')
var settings = require('./settings')
var path = require('path')
const fetch = require('node-fetch');
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

const DELAY_MIN = 1000
const DELAY_MAX = 3000

client.on("message", function onMessageHandler(channel, userstate, msg, self) {
    if (self) {return}
    let username = userstate.username
    let isSubscriber = userstate.subscriber
    let isMod = userstate.mod

    // Google assistant
    if (msg.startsWith('!google ')) {
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
                        }, Math.random() * (DELAY_MAX - DELAY_MIN) + DELAY_MIN )
                    }
                )
            );
        }catch (error) {
            console.log("error: ", error)
        }
    } else if (msg.startsWith('!rps ')) {
        // get player name
        let playerName = msg.replace('!rps ', '')
        if (playerName === settings.USERNAME) {
            return
        }
        
        // check if user is in the room
        fetch(`https://tmi.twitch.tv/group/user/${channel.replace('#', '')}/chatters`)
            .then(response => {
                return response.json()
            })
            .then(json => {
                // combine the keys
                let viewers = []
                Object.keys(json.chatters).forEach((key, index) => {
                    viewers = viewers.concat(json.chatters[key])
                })
                let isOpponentFound = false
                for(let i = 0; i < viewers.length; ++i) {
                    if (viewers[i] === playerName) {
                        isOpponentFound = true
                        break
                    }
                }
                // start a game with the opponent
                if (isOpponentFound) {
                    
                }
            })
    }
})

client.on("whisper", function onMessageHandler(channel, userstate, msg, self) {
    if (self) {return}
    let username = userstate.username
    let isSubscriber = userstate.subscriber
    let isMod = userstate.mod
    // console.log(msg)
    // client.whisper(settings.CHANNELS[0], "msg")
})

sanitizeResponse = (response) => {
    return response.replace('ACTION', "")
}
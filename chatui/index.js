var chatApiUrl = "https://purecloud-bot-hub.herokuapp.com/channels/web/conversations";
var chatConfigurationId = "e2268959-4d5e-4595-1a2d-a306a9ae1c2d";
var senderId = undefined;

var messageToSend = '';
var messageResponses = [
    'Why did the web developer leave the restaurant? Because of the table layout.',
    'How do you comfort a JavaScript bug? You console it.',
    'An SQL query enters a bar, approaches two tables and asks: "May I join you?"',
    'What is the most used language in programming? Profanity.',
    'What is the object-oriented way to become wealthy? Inheritance.',
    'An SEO expert walks into a bar, bars, pub, tavern, public house, Irish pub, drinks, beer, alcohol'
];


function startChatConversation() {
    console.log("...Starting chat conversation...");
    $.ajax({
        method: "POST",
        url: chatApiUrl,
        data: {
            configId: chatConfigurationId
        },
        cache: false
    }).done((result) => {
        senderId = result.senderId;
        console.log("senderId:", senderId);

        // Open web socket
        console.log("...Opening web socket...");
        let webSocket = new WebSocket('ws://purecloud-bot-hub.herokuapp.com/channels/web?senderId=' + senderId);
        webSocket.onopen = function (event) {
            //Connection is open. Start the subscription(s)
            console.log('WebSocket opened:', event);
        }
        webSocket.onerror = function (event) {
            console.error(event);
        }
        webSocket.onmessage = function (event) {
            console.log("Received message:", event);
            handleMessage(event.data);
        }
    });
}

function sendMessage(message) {
    console.log(`...Sending message: ${message} to ${chatApiUrl}/message with senderId: ${senderId}`);
    $.ajax({
        method: "POST",
        url: `${chatApiUrl}/message`,
        data: {
            senderId: senderId,
            message: message
        },
        cache: false
    }).done((result) => {
        console.log("result:", result);
    }).fail((error) => {
        console.error(error);
    });
}

function handleMessage(message) {
    if (message instanceof Blob) {
        // Ignore blob
        return;
    }
    var templateResponse = Handlebars.compile($("#message-response-template").html());
    var contextResponse = {
        response: message,
        time: this.getCurrentTime()
    };
    this.$chatHistoryList.append(templateResponse(contextResponse));
    this.scrollToBottom();
}

function init() {
    this.cacheDOM();
    this.bindEvents();
    this.render();
    this.handleMessage("Welcome! How can I help you?")
}

function cacheDOM() {
    this.$chatHistory = $('.chat-history');
    this.$button = $('button');
    this.$textarea = $('#message-to-send');
    this.$chatHistoryList = this.$chatHistory.find('ul');
}

function bindEvents() {
    this.$button.on('click', this.addMessage.bind(this));
    this.$textarea.on('keyup', this.addMessageEnter.bind(this));
}

function render() {
    this.scrollToBottom();
    if (this.messageToSend.trim() !== '') {
        var template = Handlebars.compile($("#message-template").html());
        var context = {
            messageOutput: this.messageToSend,
            time: this.getCurrentTime()
        };

        this.$chatHistoryList.append(template(context));
        this.scrollToBottom();
        this.$textarea.val('');

        // // responses
        // var templateResponse = Handlebars.compile($("#message-response-template").html());
        // var contextResponse = {
        //     response: this.getRandomItem(this.messageResponses),
        //     time: this.getCurrentTime()
        // };

        // setTimeout(function () {
        //     this.$chatHistoryList.append(templateResponse(contextResponse));
        //     this.scrollToBottom();
        // }.bind(this), 1500);

    }

}

function addMessage() {
    var message = this.$textarea.val().replace(/[\n\r]+/g, '');
    sendMessage(message);
    this.messageToSend = message;
    this.render();
}

function addMessageEnter(event) {
    // enter was pressed
    if (event.keyCode === 13) {
        this.addMessage();
    }
}

function scrollToBottom() {
    this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
}

function getCurrentTime() {
    return new Date().toLocaleTimeString().
    replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

init();
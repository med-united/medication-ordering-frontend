Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });
StompJs = require('@stomp/stompjs');


const client = new StompJs.Client({
    brokerURL: 'tcp://localhost:61616',
    connectHeaders: {
      login: 'admin',
      passcode: 'admin',
    },
    debug: function (str) {
      console.log(str);
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
});

callback = function (message) {
    // called when the client receives a STOMP message from the server
    if (message.body) {
      console.log('got message with body: ' + message.body);
      console.log('got message with header priority: ' + message.headers.priority);
      console.log('got message with header address: ' + message.headers.address);
      console.log('got message with header practice-management-translation: ' + message.headers.practiceManagementTranslation);
      console.log('got message with header receiver-public-key-fingerprint: ' + message.headers.receiverPublicKeyFingerprint + "\n");
    } else {
      console.log('got empty message');
    }
};

client.onConnect = function (frame) {

    console.log("\nframe: ", frame, "\n");

    client.publish({
        destination: 'Prescriptions',
        body: JSON.stringify({name: 'Beatriz'}),
        headers: { 'destination-type': 'ANYCAST', priority: '1', address: "Prescriptions", practiceManagementTranslation: 't2med', receiverPublicKeyFingerprint: 'SHA256:n3nqOvCrZkvW5Q4IFOd7NyhL2yL6l9sh7O2Iw4Clu1A' },
    });

};

client.onStompError = function (frame) {
    console.log('Broker reported error: ' + frame.headers['message']);
    console.log('Additional details: ' + frame.body);
};

client.activate();

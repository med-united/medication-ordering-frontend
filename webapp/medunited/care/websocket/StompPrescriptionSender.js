Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });
const StompJs = require('@stomp/stompjs');
const exampleBundle = require('../../../resources/local/bundle.json');


const client = new StompJs.Client({
    // brokerURL: 'tcp://localhost:61616',  // to run locally
    brokerURL: 'wss://broker.med-united.health/stomp',
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

client.onConnect = function (frame) {

    console.log("\nframe: ", frame, "\n");

    client.publish({
        destination: 'Prescriptions',
        body: JSON.stringify(exampleBundle),
        headers: { 'destination-type': 'ANYCAST', priority: '1', address: "Prescriptions", practiceManagementTranslation: 't2med', receiverPublicKeyFingerprint: 'SHA256:n3nqOvCrZkvW5Q4IFOd7NyhL2yL6l9sh7O2Iw4Clu1A' },
    });

};

client.onStompError = function (frame) {
    console.log('Broker reported error: ' + frame.headers['message']);
    console.log('Additional details: ' + frame.body);
};

client.activate();

Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });
StompJs = require('@stomp/stompjs');


const client = new StompJs.Client({
    brokerURL: 'wss://broker.med-united.health/stomp',
    connectHeaders: {
      login: 'admin',
      passcode: 'admin',
    },
    debug: function (str) {
      console.log(str);
    },
    reconnectDelay: 3000,
    heartbeatIncoming: 100,
    heartbeatOutgoing: 100,
});

client.onConnect = function (frame) {

    client.publish({
        destination: '/Prescriptions/Queue',
        body: 'Hello world'
    });

};
  
client.onStompError = function (frame) {
    console.log('Broker reported error: ' + frame.headers['message']);
    console.log('Additional details: ' + frame.body);
};

client.activate();

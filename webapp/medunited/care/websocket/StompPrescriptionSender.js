/* global StompJs:true */

sap.ui.define([
    'medunited/care/lib/stomp.umd.min'
], function () {
    'use strict';

    return {
        sendFHIRBundlesToBroker: function (listOfBundles) {

            let client = this._establishConnectionToSTOMPWebSocket();

            client.onConnect = function (frame) {

                for (let bundle of listOfBundles) {

                    const tx = client.begin();

                    client.publish({
                        destination: 'Prescriptions',
                        body: bundle,
                        headers: { transaction: tx.id, 'destination-type': 'ANYCAST', priority: '1', address: "Prescriptions", practiceManagementTranslation: 'isynet', receiverPublicKeyFingerprint: '12345' },
                    });

                    tx.commit();
                }
                client.deactivate();
            };

            client.onStompError = function (frame) {
                console.log('Broker reported error: ' + frame.headers['message']);
                console.log('Additional details: ' + frame.body);
            };
        },

        _establishConnectionToSTOMPWebSocket: function () {

            let client = new StompJs.Client({
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

            // comment the following line to enable debug messages
            client.debug = function (str) { };

            client.activate();

            return client;
        }
    };
}, true);

const config = require("../config");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8080 });

const alertEmitter = require("../events/alertEmitter");
const getCPUUsage = require("../services/metricService");

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  ws.send(JSON.stringify({
    message: "Connected to monitoring system"
  }));
});
alertEmitter.on("thresholdBreach", (alert) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(alert));
    }
  });
});

module.exports = wss;
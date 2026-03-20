const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  ws.send(JSON.stringify({
    message: "Connected to monitoring system"
  }));
});

module.exports = wss;
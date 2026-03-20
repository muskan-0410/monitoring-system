const getCPUUsage = require("../services/metricService");

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  ws.send(JSON.stringify({
    message: "Connected to monitoring system"
  }));

  setInterval(() => {
  getCPUUsage((data) => {

    const alert = {
      type: "CPU_ALERT",
      value: data.value,
      message: data.value > 70 ? "High CPU usage" : "Normal"
    };

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(alert));
      }
    });

  });
}, 5000);
});

module.exports = wss;
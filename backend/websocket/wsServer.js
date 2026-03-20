const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  ws.send(JSON.stringify({
    message: "Connected to monitoring system"
  }));

  setInterval(() =>{
    const alert = {
        type: "CPU_ALERT",
        value: Math.floor(Math.random()*100),
        message: "CPU usage high"
    };

    ws.send(JSON.stringify(alert));
  }, 5000);
});

module.exports = wss;
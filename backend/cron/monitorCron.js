let retryDelay = 10000; 
const maxDelay = 60000; 
const cron = require("node-cron");
const getSystemMetrics = require("../services/metricService");
const alertEmitter = require("../events/alertEmitter");
const config = require("../config");

cron.schedule("*/10 * * * * *", () => {
  console.log("Running cron job...");

  getSystemMetrics((data) => {

  const isHigh = data.cpu > config.cpuThreshold;

  const alert = {
    type: "CPU_ALERT",
    value: data.cpu,
    memory: data.memory,
    disk: data.disk,
    message: isHigh ? "High CPU usage" : "Normal"
  };

  alertEmitter.emit("thresholdBreach", alert);

  });
});
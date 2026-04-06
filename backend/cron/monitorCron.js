let retryDelay = 10000; 
const maxDelay = 60000; 
const cron = require("node-cron");
const getCPUUsage = require("../services/metricService");
const alertEmitter = require("../events/alertEmitter");
const config = require("../config");

cron.schedule("*/10 * * * * *", () => {
  console.log("Running cron job...");

  getCPUUsage((data) => {
  const isHigh = data.value > config.cpuThreshold;

  const alert = {
    type: "CPU_ALERT",
    value: data.value,
    message: isHigh ? "High CPU usage" : "Normal"
  };

  alertEmitter.emit("thresholdBreach", alert);

  if (isHigh) {
    retryDelay = Math.min(retryDelay * 2, maxDelay);
  } else {
    retryDelay = 10000;
  }
});
});
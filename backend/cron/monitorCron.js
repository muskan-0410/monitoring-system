let retryDelay = 10000; 
const maxDelay = 60000; 
const cron = require("node-cron");
const getSystemMetrics = require("../services/metricService");
const alertEmitter = require("../events/alertEmitter");
const config = require("../config");

cron.schedule("*/10 * * * * *", () => {
  console.log("Running cron job...");

  getSystemMetrics((data) => {
    if (data.cpu > config.cpuThreshold) {
      alertEmitter.emit("thresholdBreach", {
        type: "CPU_ALERT",
        value: data.cpu,
        message: "High CPU usage"
      });
    }

    if (data.memory > 80) {
      alertEmitter.emit("thresholdBreach", {
        type: "MEMORY_ALERT",
        value: data.memory,
        message: "High Memory usage"
      });
    }

    if (data.disk > 80) {
      alertEmitter.emit("thresholdBreach", {
        type: "DISK_ALERT",
        value: data.disk,
        message: "High Disk usage"
      });
    }

    alertEmitter.emit("thresholdBreach", {
      type: "SYSTEM_METRICS",
      cpu: data.cpu,
      memory: data.memory,
      disk: data.disk
    });

  });
});
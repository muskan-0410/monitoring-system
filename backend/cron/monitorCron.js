let retryDelay = 10000; 
const maxDelay = 60000; 
const cron = require("node-cron");
const getSystemMetrics = require("../services/metricService");
const alertEmitter = require("../events/alertEmitter");
const metricService = require("../../Database/Services/metricService");
const alertService = require("../../Database/Services/alertService");
const Config = require("../../Database/Models/configModel");
let config;
cron.schedule("*/10 * * * * *",async () => {
  console.log("Running cron job...");
  config = await Config.getActive();
  getSystemMetrics(async (data) => {
    
    try {
      await metricService.insertMetric({
        cpu: data.cpu,
        memory: data.memory,
        disk: data.disk
      });
    } catch (err) {
      console.log("Metric DB error:", err.message);
    }

    if (data.cpu > config.cpuThreshold) {
      alertEmitter.emit("thresholdBreach", {
        type: "CPU_ALERT",
        value: data.cpu,
        message: "High CPU usage"
      });
      await alertService.insertAlert({
      type: "CPU",
      value: data.cpu,
      threshold: config.cpuThreshold
    });
    }

    if (data.memory > config.memoryThreshold) {
      alertEmitter.emit("thresholdBreach", {
        type: "MEMORY_ALERT",
        value: data.memory,
        message: "High Memory usage"
      });
      await alertService.insertAlert({
      type: "MEMORY",
      value: data.memory,
      threshold: config.memoryThreshold
    });
    }

    if (data.disk > config.diskThreshold) {
      alertEmitter.emit("thresholdBreach", {
        type: "DISK_ALERT",
        value: data.disk,
        message: "High Disk usage"
      });
      await alertService.insertAlert({
      type: "DISK",
      value: data.disk,
      threshold: config.diskThreshold
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
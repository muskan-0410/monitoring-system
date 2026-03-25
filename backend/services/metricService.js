const { exec } = require("child_process");

function getCPUUsage(callback) {
  exec("powershell -ExecutionPolicy Bypass -File ../scripts/cpu_check.ps1", (err, stdout) => {
    if (err) {
      console.error("Error fetching CPU:", err);
      return;
    }

    try {
      const cleaned = stdout.trim();

      const data = JSON.parse(cleaned);
      callback(data);

    } catch (e) {
      console.error("Parsing error:", e);
      console.log("Raw output:", stdout); // 👈 IMPORTANT DEBUG
    }
  });
}

module.exports = getCPUUsage;
const { exec } = require("child_process");

function getSystemMetrics(callback) {
  exec("powershell -ExecutionPolicy Bypass -File scripts/cpu_check.ps1", (err, stdout) => {
    if (err) {
      console.error("Error:", err);
      return;
    }

    try {
      const data = JSON.parse(stdout);
      callback(data);
    } catch (e) {
      console.log("Parsing error:", stdout);
    }
  });
}

module.exports = getSystemMetrics;
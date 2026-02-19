const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());


app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Monitoring backend is running"
  });
});

app.listen(PORT, () => {
  console.log(`Monitoring backend started on port ${PORT}`);
});

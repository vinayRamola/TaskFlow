require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const connectMongo = require("../shared/mongo");
const jobRoutes = require("./routes/jobs");
const statsRoutes = require("./routes/stats");
const workersRoutes = require("./routes/workers");
const { initWebSocket } = require("../shared/websocket");

const app = express();

app.use(cors());
app.use(express.json());


connectMongo();

app.use("/jobs", jobRoutes);
app.use("/stats", statsRoutes);

app.use("/workers", workersRoutes);

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initWebSocket(server);

server.listen(PORT, () => {
    console.log(`Producer API running on port ${PORT}`);
});
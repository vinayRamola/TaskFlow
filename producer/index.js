require("dotenv").config();

const express = require("express");
const connectMongo = require("../shared/mongo");
const jobRoutes = require("./routes/jobs");
const statsRoutes = require("./routes/stats");

const app = express();

app.use(express.json());

connectMongo();

app.use("/jobs", jobRoutes);
app.use("/stats", statsRoutes);

app.listen(3000, () => {
    console.log("Producer API running on port 3000");
});
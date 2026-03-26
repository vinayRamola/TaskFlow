require("dotenv").config();

const express = require("express");
const connectMongo = require("../shared/mongo");
const jobRoutes = require("./routes/jobs");

const app = express();

app.use(express.json());

connectMongo();

app.use("/jobs", jobRoutes);

app.listen(3000, () => {
    console.log("Producer API running on port 3000");
});
const mongoose = require("mongoose");

async function connectMongo() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
}

module.exports = connectMongo;
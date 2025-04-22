const mongoose = require("mongoose")
const {logger} = require("../utils/logger.util");

const db = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("DB connected successfully!!🚀")
        logger.info("DB connected successfully")
    } catch (error) {
        console.log("DB connection failed!!", error)
        logger.error("DB connection failed", error)
        process.exit(1)
    }
}


module.exports = db;

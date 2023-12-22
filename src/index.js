// require('dotenv').config({path:'./env'})
import conncetDB from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config({
    path:'./env'
})

conncetDB()

/*
import { express } from "express";
const app = express()

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("ERROR:", error);
            throw error
        })
        app.listen(process.env.PORT, ()=>{
            console.log(`listening on: ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ",error);
        throw error
    }
})()

*/
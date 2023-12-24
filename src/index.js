// require('dotenv').config({path:'./env'})
import { app } from "./app.js";
import conncetDB from "./db/index.js";
import dotenv from 'dotenv'

dotenv.config({
    path:'./.env'
})

conncetDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server running at port ${process.env.PORT}`);
    })
    app.on("error", (error)=>{
        console.log("Error", error);
        throw error
    })
})
.catch((error)=>{
    console.log('MOngoDb connection failed !!! ',error);
}

)

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
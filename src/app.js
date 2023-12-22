import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express()


// /////////// APP CONFIGURATION START /////////////////
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))       // limitizing the data which we will recieve from multiple sources
app.use(express.urlencoded({extended:true, limit: "16kb"}))     //url encoding thing
app.use(express.static("public"))       // for files data like(pdf, images etc.)

app.use(cookieParser())

// /////////// APP CONFIGURATION END /////////////////
export {app}
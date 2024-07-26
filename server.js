const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.port
app.use(express.json())
const db = require('./config/db')
const router = require('./routers/schoolRouter')
app.use(router)


app.listen(port, ()=>{
    console.log(`app is listening to ${port}`)
})
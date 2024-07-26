const express = require('express')
require('dotenv').config()
const app = express()
const port = process.env.port
app.use(express.json())
const db = require('./config/db')
const router = require('./routers/schoolRouter')
app.use(router)
app.all("*",(req,res)=>{
    return res.status(200).send('welcome to my first hosting')
})


app.listen(port, ()=>{
    console.log(`app is listening to ${port}`)
})
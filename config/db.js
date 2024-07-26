const mongoose = require('mongoose')
require('dotenv').config()

const url = process.env.url
mongoose.connect(url).then(
    ()=>{
        console.log('connected to database success')
    }
).catch((error)=>{
    console.log(error.message)
})
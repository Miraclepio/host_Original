const express = require('express')
const session=require('express-session')
const mongoDBSession=require('connect-mongodb-session')(session)
require('dotenv').config()
const app = express()
const port = process.env.port
app.use(express.json())
const db = require('./config/db')
const router = require('./routers/schoolRouter')

app.use(router)

const store=new mongoDBSession({
uri:process.env.url,
collection:'my session'

})


app.use(session({
    secret:"key that will sign the cookies",
    resave:false,
    saveUninitialized:false,
    store:store
    // store:new mongoDBSession({ mongooseConnection:mongoose.connection })
}))

app.all("*",(req,res)=>{
    req.session.isAuth=true
    return res.status(200).send('welcome to my first hosting') 
})
 

app.listen(port, (
)=>{
    console.log(`app is listening to ${port}`)
})
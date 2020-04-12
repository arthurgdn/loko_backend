const express = require('express')
const userRouter = require('./routers/user')
const profileRouter = require('./routers/profile')
const offerRouter = require('./routers/offer')
const userRecommendationRouter = require('./routers/userRecommendation')
const {messageRouter,liveMessaging} = require('./routers/message')
const collaborationDemandRouter = require('./routers/collaborationDemand')
const offerCommentRouter = require('./routers/offerComment')
const socketioAuth = require('./middleware/socketioAuth')
const http = require('http')
const socketio = require('socket.io')
//runs database connection
require('./db/mongoose')
//use bodyParser to parse requests to use req.body property
const bodyParser = require('body-parser')
const app = express()
const server = http.createServer(app)
const io = socketio(server)


const port = process.env.PORT

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json())
app.use(userRouter)
app.use(profileRouter)
app.use(offerRouter)
app.use(messageRouter)
app.use(userRecommendationRouter)
app.use(collaborationDemandRouter)
app.use(offerCommentRouter)
io.use(socketioAuth)
io.on('connection',liveMessaging)
app.listen(port, () => {
    console.log('Server is up on port ' + port)
})







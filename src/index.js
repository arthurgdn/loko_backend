const express = require('express')
const userRouter = require('./routers/user')
const profileRouter = require('./routers/profile')
const offerRouter = require('./routers/offer')
const userRecommendationRouter = require('./routers/userRecommendation')
const {messageRouter,generateLiveMessage} = require('./routers/message')
const collaborationDemandRouter = require('./routers/collaborationDemand')
const offerCommentRouter = require('./routers/offerComment')
const conversationRouter = require('./routers/conversation')
const groupRouter = require('./routers/group')
const groupMembershipRouter = require('./routers/groupMembership')
const locationRouter = require('./routers/location')
const feedRouter = require('./routers/feed')
const socketioAuth = require('./middleware/socketioAuth')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
//runs database connection
require('./db/mongoose')
//use bodyParser to parse requests to use req.body property
const bodyParser = require('body-parser')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const publicPath = path.join(__dirname,'../public/')

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
app.use(conversationRouter)
app.use(groupRouter)
app.use(groupMembershipRouter)
app.use(locationRouter)
app.use(feedRouter)

app.use(express.static(publicPath))

io.use(socketioAuth)
const liveMessaging = generateLiveMessage(io)
io.on('connection',liveMessaging)
server.listen(port, () => {
    console.log('Server is up on port ' + port)
})







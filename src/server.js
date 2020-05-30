const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')


const socketioAuth = require('./middleware/socketioAuth')
const {generateLiveMessage} = require('./routers/message')

//Connexion à la base de données
require('./db/mongoose')


//Charge les différents routeurs
const userRouter = require('./routers/user')
const profileRouter = require('./routers/profile')
const offerRouter = require('./routers/offer')
const userRecommendationRouter = require('./routers/userRecommendation')
const {messageRouter} = require('./routers/message')
const collaborationDemandRouter = require('./routers/collaborationDemand')
const offerCommentRouter = require('./routers/offerComment')
const conversationRouter = require('./routers/conversation')
const groupRouter = require('./routers/group')
const groupMembershipRouter = require('./routers/groupMembership')
const locationRouter = require('./routers/location')
const feedRouter = require('./routers/feed')
const keywordRouter = require('./routers/keyword')
const securityRouter = require('./routers/security')
const searchRouter = require('./routers/search')
const showcaseRouter = require('./routers/showcase')
const analyticsRouter = require('./routers/analytics')


//Mise en place du serveur Express et de socket.io
const app = express()

//Mise en place du serveur Express et de socket.io
const server = http.createServer(app)

// Prendre en compte les CORS lors de la connexion avec le frontend
const io = socketio(server,{
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, 
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
})

const port = process.env.PORT

//On ajoute le middleware d'auth socket.io
//Gestion des CORS côté socket.io
io.use(socketioAuth)
io.origins((origin, callback) => {
    
    if (origin !== 'http://localhost:8080') {
        return callback('origin not allowed', false);
    }
    callback(null, true);
  })
const liveMessaging = generateLiveMessage(io)
io.on('connection',liveMessaging)




//Templates pour le rendu côté serveur
const publicPath = path.join(__dirname,'../public/')
const viewsPath = path.join(__dirname,'../templates/views')
app.set('view engine','hbs')
app.set('views',viewsPath)

//Utilisation de bodyParser pour faciliter l'exploitation des requetes
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json())
//Middleware permettant de gérer les CORS, à changer pour le passage en prod
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Methods","PUT,GET,POST,DELETE,PATCH")
    next();
    });


//On défini le chemin vers les fichiers statiques
app.use(express.static(publicPath))

//On ajoute les différentes routes 
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
app.use(keywordRouter)
app.use(securityRouter)
app.use(searchRouter)
app.use(showcaseRouter)
app.use(analyticsRouter)

module.exports = server







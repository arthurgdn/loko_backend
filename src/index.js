const express = require('express')
const bodyParser = require('body-parser')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const hbs = require('hbs')


const socketioAuth = require('./middleware/socketioAuth')
const setupRoutes = require('./setupRoutes')
const {generateLiveMessage} = require('./routers/message')

//Connexion à la base de données
require('./db/mongoose')

//Mise en place du serveur Express et de socket.io
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicPath = path.join(__dirname,'../public/')
const viewsPath = path.join(__dirname,'../templates/views')
app.set('view engine','hbs')
app.set('views',viewsPath)

const port = process.env.PORT
//Utilisation de bodyParser pour faciliter l'exploitation des requetes
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    res.header("Access-Control-Allow-Methods","PUT,GET,POST,DELETE,PATCH")
    next();
    });

//On défini le chemin vers les fichiers statiques
app.use(express.static(publicPath))

//On défini les routes des api
setupRoutes(app)

//On ajoute le middleware d'auth socket.io
io.use(socketioAuth)
const liveMessaging = generateLiveMessage(io)
io.on('connection',liveMessaging)

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})







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
//Templates pour le rendu côté serveur
const publicPath = path.join(__dirname,'../public/')
const viewsPath = path.join(__dirname,'../templates/views')
app.set('view engine','hbs')
app.set('views',viewsPath)

const port = process.env.PORT
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

//On défini les routes des api
setupRoutes(app)

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

server.listen(port, () => {
    console.log('Server is up on port ' + port)
})







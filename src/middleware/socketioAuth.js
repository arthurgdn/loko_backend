const jwt = require('jsonwebtoken');
const User = require('../models/user');

//Gestion de l'authentification lors de la connexion avec les sockets
//Middleware appliqué lors de l'utilisation du service de messagerie instantanée
const socketioAuth = async (socket, next)=>{

  try{
    //On extrait le token que l'on compare avec celui de la DB
    const header = socket.handshake.headers['authorization'];
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({_id: decoded._id, 'tokens.token': token});

    if(!user) {

      throw new Error('Impossible de s\'identifier');
    }
    //On attache l'utilisateur et le token au socket
    socket.request.token = token;
    socket.request.user = user;

    return next();
  }catch(e) {

    return next(new Error('Impossible de s\'identifier'));
  }

};


module.exports = socketioAuth;
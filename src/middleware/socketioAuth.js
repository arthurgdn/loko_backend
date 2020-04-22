const jwt = require('jsonwebtoken')
const User = require('../models/user')
//deal with authentication on backend
const socketioAuth = async (socket,next)=>{
    
    try{
        
        const header = socket.handshake.headers['authorization']
        const token = header.split(' ')[1]
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        
        const user = await User.findOne({_id : decoded._id,'tokens.token':token})
        
        if(!user){
            
            throw new Error("Impossible de s'identifier")
        }
        //We send the token and the potential user in the request
        socket.request.token = token
        socket.request.user = user
        
        return next()
    }catch(e){
        
        return next(new Error("Impossible de s'identifier"))
    }
    
}



module.exports = socketioAuth
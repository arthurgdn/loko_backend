const express = require('express')
const Conversation = require('../models/conversation')
const {generateLocationMessage,generateMessage} = require('../controllers/utils/messages')
const auth = require('../middleware/auth')

const router = new express.Router()

//API to send back the messages in a conversation
//We might add filtering later on 
router.get('messages/conversation/:id',auth,async(req,res)=>{
    try{
        const conversation = await Conversation.findById(req.params.id)
        if(!conversation){
            res.status(404).send()
        }
        if(conversation.members.find((member)=>String(member.member)===String(req.user._id))===null){
            return res.status(400).send('You are not a member of this conversation')
        }
        await conversation.populate({
            path:'messages'
        }).execPopulate()
        res.send(conversation.messages)
    }catch(e){
        res.status(400).send(e)
    }
})

const liveMessaging = (socket) =>{
    console.log('New WebSocket Connected')
    //We will check if auth is correct here when connecting to the client
    console.log(socket.request.user,socket.request.token)
    //User can send their location here
    socket.on('sendLocation', (conv_id,location,callback)=>{
        const user = socket.request.user
        
        io.to(conv_id).emit('locationMessage',generateLocationMessage(user.firstName + ' '+ user.lastName,"https://google.com/maps?q="+ location.latitude + ","+ location.longitude))
        callback()
    })

    socket.on('join',async (conv_id,callback)=>{
        const user = socket.request.user
        try {
            const conversation = await Conversation.findById(conv_id)
            if(!conversation){
                callback('No corresponding conversation')
            }
            if(conversation.members.find((member)=>String(member.member)===String(user._id))===null){
                callback('You are not a member of this conversation')
            }
        }catch(e){
            callback(e)
        }
        socket.join(conv_id)
        //might add possibility to see connected users
    })
    
    socket.on('messageSent',async (conv_id,message,callback)=>{
        const user = socket.request.user
        io.to(conv_id).emit('messageUpdated',generateMessage(user.firstName + ' '+user.lastName,message))
        //we add the message to the db
        try {
            const message = new Message({
                conversation : conv_id,
                author : user._id,
                content : message
            })
            await message.save()
            callback()
        }catch(e){
            callback(e)
        }
        
    })
    //Might add possibility to delete a message
    
}
module.exports = {
    messageRouter : router,
    liveMessaging
}
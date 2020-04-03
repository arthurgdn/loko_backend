const User = require('../../models/user')
const mongoose = require('mongoose')
const textMatch = require('../utils/textMatch')
const findCollaboratorByName = async (searchString,user) =>{
    const matchingCollaborators = []
    try {
    for(collaborator of user.collaborators){
        let collaboratorId = collaborator.collaborator
        
        let correspondingUser = await User.findById(String(collaboratorId))
        
        if (correspondingUser!==null){
            let nameToMatch = correspondingUser.firstName + ' ' + correspondingUser.lastName
            if(textMatch(searchString,nameToMatch)){
                matchingCollaborators.push(correspondingUser)
            }
        }
    }
    
    return matchingCollaborators
}catch(e){
    throw new Error(e)
}
    
}
module.exports = findCollaboratorByName
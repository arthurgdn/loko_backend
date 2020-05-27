//Outil pour générer le format de renvoi des messages lors des discussions instantannées
const generateMessage = (username,text)=>{
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

//On pourra rajouter ensuite une fonctionnalité permettant d'envoyer sa position gps
const generateLocationMessage = (username,link)=>{
    return {
        username,
        link,
        createdAt : new Date().getTime()
    }
}
module.exports = {
    generateMessage,
    generateLocationMessage
}
const generateMessage = (username,text)=>{
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}
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
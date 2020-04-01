const sgMail = require('@sendgrid/mail')

const sendgridAPIkey = process.env.SENDGRID_API_KEY
sgMail.setApiKey(sendgridAPIkey)

const sendWelcomeEmail = (email,name)=>{
    sgMail.send({
        to : email,
        from : 'arthurguedon0@gmail.com',
        subject : 'Welcome to the task manager app !',
        text : 'Welcome ' + name + ' ! Thanks for joining in, we hope our app makes your life easier.'
    })
}
const sendGoodbyeEmail = (email,name)=>{
    sgMail.send({
        to : email,
        from :  'arthurguedon0@gmail.com',
        subject : 'You deleted your account',
        text : 'Hello '+ name + ' , we are sorry to here that you unsuscribed, tell us why ! '
    })
}
module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}
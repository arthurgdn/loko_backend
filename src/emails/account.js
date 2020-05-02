const sgMail = require('@sendgrid/mail')

const sendgridAPIkey = process.env.SENDGRID_API_KEY
sgMail.setApiKey(sendgridAPIkey)


const sendGoodbyeEmail = (email,name)=>{
    sgMail.send({
        to : email,
        from :  'arthurguedon0@gmail.com',
        subject : 'Suppression de votre compte Loko',
        text : 'Bonjour '+ name + " , nous sommes tristes d'apprendre que vous vous êtes désinscrit de Loko, n'hésitez pas à revenir vers nous pour nous indiquer ce qui ne vous a pas plu ! "
    })
}

const sendVerificationEmail = (email,name,token)=>{
    //only for dev
    const link = String(process.env.PORT)+'/verify/'+token
    sgMail.send({
        to : email,
        from: 'arthurguedon0@gmail.com',
        subject : 'Activation de votre compte Loko',
        html : "Bienvenue " + name + " ! <br> Merci d'avoir rejoint la plateforme, vous allez pouvoir dès maintenant commencer à créer et parcourir des annonces dans des domaines qui vous correspondent, près de chez vous! <br> Veuillez commencer par vérifier votre compte en cliquant sur le lien suivant : <br>" + ' <a href="http://localhost:'+link+'">Vérifier mon compte</a> <br>' + "L'équipe de Loko "
    
    })
}

const sendPasswordResetEmail = (email,name,token)=>{
    //only for dev
    const link = String(process.env.PORT)+'/reset/'+token
    console.log(link)
    sgMail.send({
        to : email,
        from: 'arthurguedon0@gmail.com',
        subject : 'Réinitialisation de votre mot de passe Loko',
        html : "Bonjour " + name + " ! <br> Vous avez demandé à réinitialiser votre mot de passe, veuillez suivre le lien suivant : <br>" + ' <a href="http://localhost:'+link+'">Réinitialiser mon mot de passe</a> <br> Si cette demande ne viens pas de vous, veuillez cliquer sur le lien et cliquer sur le bouton correspondant. <br>' + "L'équipe de Loko "
    
    })
}

module.exports = {
    sendVerificationEmail,
    sendGoodbyeEmail,
    sendPasswordResetEmail
}
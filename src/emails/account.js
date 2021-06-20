const sgMail = require('@sendgrid/mail');
//Configuration de SendGrid
const sendgridAPIkey = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(sendgridAPIkey);

//Différentes fonctions d'envoi d'email lors de la création d'un compte,
// réinitialisation de mot de passe et suppression d'un compte

const sendGoodbyeEmail = (email, name)=>{
  sgMail.send({
    to: email,
    from: 'arthurguedon0@gmail.com',
    subject: 'Suppression de votre compte Loko',
    text: 'Bonjour '+ name +
    ' , nous sommes tristes d\'apprendre que vous vous êtes désinscrit de Loko, n\'hésitez'+
     ' pas à revenir vers nous pour nous indiquer ce qui ne vous a pas plu ! '
  });
};

const sendVerificationEmail = (email, name, token)=>{
  //On redirige vers le serveur local
  //On devra mettre en place une variable d'env. ensuite lors du passage en prod
  //On pourra également rajouter une variable d'env.
  // pour l'email d'envoi lorsqu'il aura été configuré

  const link = process.env.BACKEND_URL+'/verify/'+token;
  sgMail.send({
    to: email,
    from: 'arthurguedon0@gmail.com',
    subject: 'Activation de votre compte Loko',
    html: 'Bienvenue ' + name +
     ' ! <br> Merci d\'avoir rejoint la plateforme, vous allez pouvoir dès maintenant'+
     'commencer à créer et parcourir des annonces dans des domaines qui vous correspondent, près'+
     'de chez vous! <br> Veuillez commencer par vérifier'+
     'votre compte en cliquant sur le lien suivant : <br>'+
      ' <a href="'+link+'">Vérifier mon compte</a> <br>' + 'L\'équipe de Loko '

  });
};

const sendPasswordResetEmail = (email, name, token)=>{
  //Même remarque qu'au dessus, l'URL sera à revoir en prod
  const link = process.env.BACKEND_URL+'/reset/'+token;
  console.log(link);
  sgMail.send({
    to: email,
    from: 'arthurguedon0@gmail.com',
    subject: 'Réinitialisation de votre mot de passe Loko',
    html: 'Bonjour ' + name +
    ' ! <br> Vous avez demandé à réinitialiser votre mot de passe,'+
    'veuillez suivre le lien suivant : <br>'+
    ' <a href="'+link+'">Réinitialiser mon mot de passe</a> <br> Si cette demande'+
    'ne viens pas de vous, veuillez cliquer sur le lien et cliquer'+
    'sur le bouton correspondant. <br>'+
     'L\'équipe de Loko '

  });
};

module.exports = {
  sendVerificationEmail,
  sendGoodbyeEmail,
  sendPasswordResetEmail
};
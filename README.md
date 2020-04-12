# Loko backend
Loko est une plateforme de publications d'annonces avec une dimension locale, où chaque individu peut vendre des biens et des services au sein même de sa communauté. 

Le backend est réalisé en [Node.JS](https://nodejs.org/en/docs/) avec [Express](http://expressjs.com/) et [MongoDB](https://docs.mongodb.com/)

## Pour commencer

### Installation
* [Installez Node.JS](https://nodejs.org/en/download/) 
* [Installez MongoDB Community Server](https://www.mongodb.com/download-center/community)
* Pour tester les différentes requêtes possibilité d'utiliser [Postman](https://www.postman.com/downloads/)

### Installation des packages
* Executez la commande ``$ npm install``

## Config
En développement, vous devez rajouter à la racine du projet un dossier config et y ajouter un fichier dev.env qui contient les variables d'environnement PORT, JWT_SECRET, MONGODB_URL, qui sont respectivement le port de sortie de l'application, le secret utilisé pour les jsonwebtoken et l'url vers la bdd.
## Démarrage
* Pour lancer la base de données ``$ [Chemin vers mongod.exe] -dbpath=[dossier de sauvegarde de la bdd]``
* Pour lancer le serveur de dev  ``$ npm run dev``
* Pour lancer le serveur de production ``$npm run start``





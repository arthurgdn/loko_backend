const mongoose = require('mongoose')

//Connexion à la base de donnée en utilisant mongoose
mongoose.connect(process.env.MONGODB_URL,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:false
})






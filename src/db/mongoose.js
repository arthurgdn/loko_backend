const mongoose = require('mongoose')

//connects to mongoose
mongoose.connect(process.env.MONGODB_URL,
{useNewUrlParser:true,useCreateIndex:true,useUnifiedTopology:true,useFindAndModify:false})






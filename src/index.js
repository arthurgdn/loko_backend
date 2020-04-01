const express = require('express')

//runs database connection
require('./db/mongoose')
//use bodyParser to parse requests to use req.body property
const bodyParser = require('body-parser')

const app = express()

const port = process.env.PORT

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json())


app.listen(port, () => {
    console.log('Server is up on port ' + port)
})







const server = require('./server')
const port = process.env.PORT
server.listen(port, () => {
    console.log('Server is up on port ' + port)
})







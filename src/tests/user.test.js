const request = require('supertest')
const User = require('../models/user')
const Profile = require('../models/profile')
const server = require('../server')
const testUserOne = {
    "firstName":"John",
    "lastName":"Michael",
    "email":"john.michael@exemple.com",
    "password":"randompass"
}

beforeEach(async ()=>{
    await User.deleteMany()
    const user =  new User({...testUserOne,validatedEmail:true})
    await new Profile({user : user._id}).save()
    await user.save()
})

test('Inscrire un utilisateur', async ()=>{
    await request(server).post('/users')
    .set('Content-Type','application/json')
    .send({
        "firstName":"John",
        "lastName":"Bob",
        "email":"john.bob@exemple.com",
        "password":"randompass"
    }).expect(201)
})
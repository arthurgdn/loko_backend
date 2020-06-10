const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('../models/user')
const Profile = require('../models/profile')
const server = require('../server')

const testUserOneId = new mongoose.Types.ObjectId()
const testUserOne = {
    "_id" : testUserOneId,
    "firstName":"John",
    "lastName":"Michael",
    "email":"john.michael@exemple.com",
    "password":"randompass",
    "tokens" : [{
        "token" : jwt.sign({_id:testUserOneId},process.env.JWT_SECRET)
    }]
}

beforeEach(async ()=>{
    await User.deleteMany()
    const user =  new User({...testUserOne,validatedEmail:true})
    await new Profile({user : user._id}).save()
    await user.save()
})

test('Doit inscrire un utilisateur', async ()=>{
    const res = await request(server).post('/users')
    .set('Content-Type','application/json')
    .send({
        "firstName":"John",
        "lastName":"Bob",
        "email":"john.bob@exemple.com",
        "password":"randompass"
    }).expect(201)

    const user = await User.findById(res.body.user._id)
    expect(user).not.toBeNull()
    expect(res.body).toMatchObject({
        user : {
        firstName: "John",
        lastName: "Bob"
        },
        token : user.tokens[0].token
    })
    })

test('Doit connecter un utilisateur', async ()=>{
    const res = await request(server).post('/users/login')
    .set('Content-Type','application/json')
    .send({
        "email":testUserOne.email,
        "password":testUserOne.password
    }).expect(200)

    const user = await User.findById(res.body.user._id)
    expect(res.body.token).toBe(user.tokens[1].token)
})

test('Doit refuser la connexion de l utilisateur', async ()=>{
     await request(server).post('/users/login')
    .set('Content-Type','application/json')
    .send({
        "email":testUserOne.email,
        "password":"wrongpass"
    }).expect(400)
})

test('Doit renvoyer le profil de l utilisateur', async ()=>{
    await request(server).get('/users/me')
    .set('Authorization',`Bearer ${testUserOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Ne doit pas renvoyer le profil lorsque le token est mauvais', async ()=>{
    await request(server).get('/users/me')
    .send()
    .expect(401)
})

test('Doit supprimer l utilisateur', async ()=>{
     await request(server).post('/users/me/delete')
    .set('Content-Type','application/json')
    .set('Authorization',`Bearer ${testUserOne.tokens[0].token}`)
    .send({
        "password":testUserOne.password
    }).expect(200)

    const user = await User.findById(testUserOneId)
    expect(user).toBeNull()
})
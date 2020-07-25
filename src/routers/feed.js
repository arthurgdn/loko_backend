const express = require('express')
const User  = require('../models/user')
const Profile = require('../models/profile')
const Keyword = require('../models/keyword')
const GroupMembership = require('../models/groupMembership')
const CollaborationDemand = require('../models/collaborationDemand')
const Offer = require('../models/offer')
const auth = require('../middleware/auth')
const {distanceLatLong} = require('../tools/utils/location') 

const router = new express.Router()

//API pour générer le fil d'actualité de l'utilisateur

//L'idée de l'algorithme est de renvoyer les annonces les plus pertinentes pour l'utilisateur 
// en fonction de la localisation de l'annonce, les mots-clés associés et la date de publication
// de l'annonce
router.get('/feed',auth,async (req,res)=>{
    try{
        const feed = []
        //On note les id de chaque offre qu'on a déjà aujouté au fil d'actualité
        const feedOfferIds=[]
        const profile = await Profile.findOne({user : req.user._id})
        //On récupere les annonces avec les mots-clés associés au profil de l'utilisateur
        if(!!profile.keywords && profile.keywords.length>0){
            for(keywordObj of profile.keywords){
                const keyword = await Keyword.findById(keywordObj.keyword)
                if(!keyword){
                    return res.status(404).send()
                }
                await keyword.populate({
                path:'associatedOffers',
                options : {
                    sort:{createdAt: -1}
                }}).execPopulate()
                //On parcourt chacune des offres associées
                for(offer of keyword.associatedOffers){
                    const isCollaborator = offer.collaborators.find((collaborator)=>String(collaborator.collaborator)===String(req.user._id))
                    if(String(offer.owner)!==String(req.user._id) && offer.completedStatus === 'created' && !isCollaborator){
                        //Si l'offre est destinée à un/des groupe(s) on vérifie que l'user en est membre
                        if(offer.scope==='group'){
                            let isMember= false
                            for(group of offer.groups){
                                const member = await GroupMembership.findOne({group:group.group,user:req.user._id})
                                if(!!member){
                                    isMember = true
                                }
                            }
                            if(isMember){
                                index = feedOfferIds.indexOf(offer._id)
                                let points
                                let distance
                                if(index>=0){
                                    feed[index].points += 10
                                }else{
                                    
                                    const now = new Date()
                                    points = 10 + Math.max(20 - Math.floor(20*(now - offer.createdAt)/(3*24*3600)),0)
                                    if(offer.location.coordinates.length>0){
                                        const dist = distanceLatLong(offer.location.coordinates[1],offer.location.coordinates[0],req.user.location.coordinates[1],req.user.location.coordinates[0])
                                        points += Math.max(20-Math.floor(dist*2),0)
                                        distance = dist
                                    }
                                    
                                    //On formate les mots clés et l'auteur de l'annonce
                                    const keywords = []
                                    for(offerKeyword of offer.keywords){
            
                                    const newKeyword = await Keyword.findById(offerKeyword.keyword)
        
                                    if(!newKeyword){
                                        return res.status(404).send()
                                    }
                                    keywords.push(newKeyword)
                                    }
                                    const offerPublisher = await User.findById(offer.owner)
                                    const collaborationDemand = await  CollaborationDemand.findOne({offer:offer._id,from:req.user._id})
                                    if(!collaborationDemand){
                                        feed.push({...offer.toJSON(),keywords,points,distance,publisherName : offerPublisher.firstName + ' '+ offerPublisher.lastName, hasSentDemand:!!collaborationDemand, publisherId : offerPublisher._id})
                                        feedOfferIds.push(String(offer._id))
                                    }
                                    
                                }
                            }
                        }else{
                            index = feedOfferIds.indexOf(String(offer._id))
                            let points
                            let distance
                                if(index>=0){
                                    
                                    feed[index].points += 10
                                    
                                }else{
                                    
                                    const now = (new Date().getTime())/1000
                                    const creationDate = (new Date(offer.createdAt).getTime())/1000
                                    
                                    points = 10 + Math.max(20 - (20*(now - creationDate)/(3*24*3600)),0)
                                    if(offer.location.coordinates.length>0){
                                        const dist = distanceLatLong(offer.location.coordinates[1],offer.location.coordinates[0],req.user.location.coordinates[1],req.user.location.coordinates[0])
                                        
                                        points += Math.max(20-(dist*2),0)
                                        distance = dist
                                    }

                                    //On formate les mots clés et l'auteur de l'annonce
                                    const keywords = []
                                    for(offerKeyword of offer.keywords){
            
                                    const newKeyword = await Keyword.findById(offerKeyword.keyword)
        
                                    if(!newKeyword){
                                        return res.status(404).send()
                                    }
                                    keywords.push(newKeyword)
                                    }
                                    const offerPublisher = await User.findById(offer.owner)
                                    const collaborationDemand = await CollaborationDemand.findOne({offer:offer._id,from:req.user._id})
                                    if(!collaborationDemand){
                                        feed.push({...offer.toJSON(),hasSentDemand:!!collaborationDemand,keywords,points,distance,publisherName : offerPublisher.firstName + ' '+ offerPublisher.lastName, publisherId : offerPublisher._id})
                                        feedOfferIds.push(String(offer._id))
                                    }
                                    
                                    }
                        }
                        
                    }
                   
                }
            }
        }
        res.send(feed.sort((a, b) => a.points < b.points ? 1 : -1 ))
    }catch(e){
        console.log(e)
        res.status(400).send(e)
    }
})
module.exports = router
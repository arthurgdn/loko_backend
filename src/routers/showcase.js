const express = require('express');
const path = require('path');
const sharp = require('sharp');

const router = new express.Router();

router.get('/showcase/image', async (req, res)=>{
  const showcaseImagePath = path.join(__dirname, '../../avatars/showcase.png');
  const buffer =await  sharp(showcaseImagePath).toBuffer();
  res.set('Content-Type', 'image/jpg');
  res.send(buffer);
});

router.get('/showcase/cactus_mini', async (req, res)=>{
  const showcaseImagePath = path.join(__dirname, '../../avatars/cactus_mini.png');
  const buffer =await  sharp(showcaseImagePath).toBuffer();
  res.set('Content-Type', 'image/jpg');
  res.send(buffer);
});

module.exports = router;
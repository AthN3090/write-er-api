const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require('./models/User')
const Post = require('./models/Post')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const fs = require('fs')
const { env } = require('process')
const uploadMiddleware = multer({ dest: 'uploads/' })
const saltRounds = 10
const app = express()
const secret = 'asdinkdfnvdoasdkdfvnlssafirql'
const PORT = env.PORT || 8000
// mongodbb credentials
// username - uipost
// password - XYEeEk4IVDD8r0dm
// mongodb+srv://uipost:XYEeEk4IVDD8r0dm@cluster0.93vzfc1.mongodb.net/?retryWrites=true&w=majority

app.use(cors({ credentials: true, origin: "https://write-er-app.vercel.app" }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'))
mongoose.connect('mongodb+srv://uipost:XYEeEk4IVDD8r0dm@cluster0.93vzfc1.mongodb.net/?retryWrites=true&w=majority')

app.post("/register", uploadMiddleware.single('avatar'), async (req, res) => {
  const {avatar} = req.body
  const { username, password , headline, fullname} = req.body;

  let newPath = null
  //if avatar is not a property in req.body then it means we a a file upload
  if(!avatar) {
    const parts = req.file.originalname.split('.')
    const ext = parts[parts.length -1]
    newPath= req.file.path + '.' + ext
    fs.renameSync(req.file.path, newPath)
  }else{
    newPath = 'default'
  }

  bcrypt.hash(password, saltRounds, async (err, hash) => {
    err ? console.log(err) : console.log(hash);
    try {
      const userDoc = await User.create({
        username,
        fullname,
        headline,
        password: hash,
        avatar: newPath
      });
      res.json(userDoc);
    } catch (e) {
      res.status(400).json("username already exists ! Please try another username ");
    }
  });
});

app.post('/login', async (req, res) => {
  const {username, password} = req.body
  const userDoc = await User.findOne({username})
  if(!userDoc) return res.status(400).json("Invalid credentials")
  else {
    bcrypt.compare(password, userDoc.password, (err, result)=>{
      if(err){
        throw err
      }else{
        //logged in
        console.log(result)
        jwt.sign(
          {
            username,
            id: userDoc._id,
          },
          secret,
          {},
          (err, token) => {
            if(err) throw err
            res.cookie('token', token, {sameSite: 'none', secure: true}).json('ok')
          }
        );
      } 
        
    })
  }

})

app.post('/logout', (req, res) => {
  res.cookie('token', '', {sameSite: 'none', secure: true}).json("ok")
})


app.get('/profile', (req, res) => {
  const {token} = req.cookies
  jwt.verify(token, secret, {}, async (err,  result) =>{
    if(err) res.json('No')
    else {
      
      const {username, avatar} = await User.findById(result.id)
      res.json({username, avatar})
    }
  })
})

app.get('/author/:name', async (req, res) => {
  const {name} = req.params
  try {
    const {username, avatar, headline, fullname} = await User.findOne({username :  name}).exec()
    res.json({username, avatar, headline, fullname})
  }catch(e){
    throw e
  }
  

})
app.get('/post', async (req, res) => {
  const posts = await Post.find({}).sort({createdAt: -1}).limit(20)
  res.json(posts)  
})

app.put('/post',uploadMiddleware.single('cover'), async (req, res)=> {
  let newPath = null
  if (req.file) {
    const parts = req.file.originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = req.file.path + "." + ext;
    fs.renameSync(req.file.path, newPath);
  }
  const {token} = req.cookies
  jwt.verify(token, secret, {}, async (err,  result) =>{
    if(err) res.json('No')
    else {
      const {id, title, body, author} = req.body
      const postDoc = await Post.findById(id)
      const isAuthor = postDoc.author === result.username
      if(!isAuthor){
        return res.status(400).json("Invalid author credentials")
      }
      await postDoc.updateOne({
        title,
        body,
        author,
        cover: newPath ? newPath : postDoc.cover,
      });
      res.json("ok")
    }
    
  
  })
})

app.delete('/delete/:id', async (req, res) => {
  const {id} = req.params
  const doc = await Post.findById(id)
  try{
    const response = await Post.deleteOne({ _id: doc._id });
    if(response.deletedCount === 1) res.status(200).json("ok")
      
  }catch(e){
    res.json(e)
  }
  
})
app.get('/post/:id', async (req, res) => {
  const {id} = req.params
  const post = await Post.findById(id)
  res.json(post)
})

app.get('/filter/:topic', async (req, res) => {
  const {topic} = req.params
  const post = await Post.find({topic: topic})
  res.json(post)
})

app.post('/newpost', uploadMiddleware.single('cover') , async (req, res) => {
  const parts = req.file.originalname.split('.')
  const ext = parts[parts.length -1]
  const newPath = req.file.path + '.' + ext
  fs.renameSync(req.file.path, newPath)

  const {title, body, author, topic} = req.body
  const postDoc = await Post.create({
    title,
    body,
    cover: newPath,
    author,
    topic
  })
  res.json("ok")
})
app.listen(PORT,()=>{
    console.log("Server is running")
})

//this is server (backend script)
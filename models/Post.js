const mongoose = require('mongoose')
const {Schema, model} = mongoose
const PostSchema = new Schema({
    title: String, 
    body: String, 
    cover: String,
    author: String,
    topic: String,
},{ timestamps: true})

const PostModel = model('post', PostSchema)

module.exports = PostModel
const mongoose = require('mongoose')
const {Schema, model} = mongoose
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: [4, 'Username length should be > 3, got value {VALUE}']
    },
    fullname:{
        type:String,
        required:true,
    },
    headline:{
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
    }
})

const UserModel = model('user',UserSchema)

module.exports = UserModel

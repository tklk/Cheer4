const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reprintObj = new Schema({
    pid: { type: Schema.Types.ObjectId },
    name: { type: String },
    title: { type: String},
    day: { type: Date}
},{ _id : false });

const reprint_info = new Schema({
    reprint_from: { type: reprintObj },
    reprint_to: { type: [{ type: reprintObj }], default: undefined }
},{ _id : false });

const commentObj = new Schema({
    name: { type: String, required: true },
    head: { type: String, required: true },
    email: { type: String, required: true },
    time: { },
    content: { type: String }
});

const emojiObj = new Schema({
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    lol: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    angry: { type: Number, default: 0 }
})

const postSchema = new Schema({
    name: { type: String, required: true },
    head: { type: String, required: true },
    time: { },
    title: { type: String, required: true },
    tags: { type: Array },
    post: { type: String },
    comments: { type: [{ type: commentObj }], default: undefined },
    reprint_info: { type: reprint_info },
    pv: { type: Number, default: 0}
});

module.exports = mongoose.model('posts', postSchema);
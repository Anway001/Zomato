const mongoose = require('mongoose');

const likemodelSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    food: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true,
    },
}, { timestamps: true });

const likemodel = mongoose.model('like', likemodelSchema);
module.exports = likemodel;
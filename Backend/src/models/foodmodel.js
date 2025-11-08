const mongoose = require('mongoose');

const foodmodelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: true,
    },
    discription: {
        type: String,

    },
    foodpartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'foodpartner',
    },
    likeCount: {
        type: Number,
        default: 0,
    },
});

const foodmodel = mongoose.model('food', foodmodelSchema);
module.exports = foodmodel;
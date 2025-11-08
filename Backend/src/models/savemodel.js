const mongoose = require('mongoose');

const savemodelSchema = new mongoose.Schema({
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


const savemodel = mongoose.model('save', savemodelSchema);
module.exports = savemodel;
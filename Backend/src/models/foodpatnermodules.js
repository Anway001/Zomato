const mongoose = require('mongoose');

const foodPartnerModuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    contactName: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    followersCount: {
        type: Number,
        default: 0,
    },

})

const foodPartnerModule = mongoose.model('FoodPartner', foodPartnerModuleSchema);

module.exports = foodPartnerModule;
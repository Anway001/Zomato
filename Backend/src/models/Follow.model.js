const mongoose = require("mongoose");

const followSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner"
    }
}
, { timestamps: true })

const FollowModel = mongoose.model("Follow", followSchema);

module.exports = FollowModel;
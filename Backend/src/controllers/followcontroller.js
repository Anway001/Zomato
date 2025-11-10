const foodpartnerModel = require("../models/foodpatnermodules");
const followModel = require("../models/Follow.model");

async function followPartner(req, res) {
    try {
        const userId = req.user?._id;
        const partnerId = req.params.partnerId;

        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!partnerId) {
            return res.status(400).json({ message: "Food partner id is required" });
        }

        const partnerExists = await foodpartnerModel.findById(partnerId);
        if (!partnerExists) {
            return res.status(404).json({ message: "Food partner not found" });
        }

        const existingFollow = await followModel.findOne({
            user: userId,
            partner: partnerId
        });

        if (existingFollow) {
            await followModel.deleteOne({ _id: existingFollow._id });
            const updatedPartner = await foodpartnerModel.findByIdAndUpdate(
                partnerId,
                { $inc: { followersCount: -1 } },
                { new: true, projection: { followersCount: 1 } }
            );

            return res.status(200).json({
                message: "Unfollowed food partner",
                isFollowing: false,
                followersCount: Math.max(updatedPartner?.followersCount ?? 0, 0)
            });
        }

        await followModel.create({ user: userId, partner: partnerId });
        const updatedPartner = await foodpartnerModel.findByIdAndUpdate(
            partnerId,
            { $inc: { followersCount: 1 } },
            { new: true, projection: { followersCount: 1 } }
        );

        return res.status(200).json({
            message: "Followed food partner",
            isFollowing: true,
            followersCount: updatedPartner?.followersCount ?? 0
        });
    } catch (error) {
        res.status(500).json({ message: "Error following food partner", error: error.message });
    }
}

module.exports = {
    followPartner
};


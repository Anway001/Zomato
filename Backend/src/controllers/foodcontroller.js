const foodmodel = require('../models/foodmodel');
const likemodel = require('../models/likemodel');
const savemodel = require('../models/savemodel');
const commentmodel = require('../models/commentmodel');
const storageServices = require('../services/storageservices');

async function createFood(req, res) {
    try {
        const { v4: uuid } = await import('uuid');
        let fileUploadResult = null;
        if (req.file) {
            const fileName = `${uuid()}_${req.file.originalname}`;
            fileUploadResult = await storageServices.uploadFile(req.file, fileName);
            console.log('File upload result:', fileUploadResult);
        }
        const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const foodItem = await foodmodel.create({
            name : req.body.name,
            discription : req.body.discription,
            category: req.body.category,
            tags,
            price: req.body.price,
            availableQuantity: req.body.availableQuantity,
            video:fileUploadResult.url,
            foodpartner : req.foodpartner._id
        })
        res.status(201).json({
            message: 'Food created successfully',
            food: foodItem
        })



        
    } catch (error) {
        console.error('Error creating food:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error'
        });

    }
}


async function getFoodItem(req, res) {
    try {
        const foodId = req.params.id;
        const foodItem = await foodmodel.findById(foodId);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        res.status(200).json(foodItem);
    } catch (error) {
        console.error('Error fetching food item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getAllFoodItems (req, res) {
    try {
        const actorId = req.user?._id || req.user || req.foodpartner?._id || req.foodpartner;
        const isAuthenticated = Boolean(actorId);
        let foodItems = await foodmodel.find({}).lean();
        foodItems = foodItems.sort(() => Math.random() - 0.5);
        const foodIds = foodItems.map((item) => item._id);
        let likedSet = new Set();
        let savedSet = new Set();
        let commentCountMap = new Map();

        if (foodIds.length) {
            const commentCounts = await commentmodel.aggregate([
                { $match: { food: { $in: foodIds } } },
                { $group: { _id: '$food', count: { $sum: 1 } } }
            ]);
            commentCountMap = new Map(commentCounts.map((entry) => [String(entry._id), entry.count]));
        }

        if (actorId && foodIds.length) {
            const [likedDocs, savedDocs] = await Promise.all([
                likemodel.find({ food: { $in: foodIds }, user: actorId }).select('food').lean(),
                savemodel.find({ food: { $in: foodIds }, user: actorId }).select('food').lean()
            ]);
            likedSet = new Set(likedDocs.map((entry) => String(entry.food)));
            savedSet = new Set(savedDocs.map((entry) => String(entry.food)));
        }

        const enrichedFoodItems = foodItems.map((item) => ({
            ...item,
            likeCount: typeof item.likeCount === 'number' ? item.likeCount : 0,
            saveCount: typeof item.saveCount === 'number' ? item.saveCount : 0,
            commentCount: commentCountMap.get(String(item._id)) || 0,
            isLiked: likedSet.has(String(item._id)),
            isSaved: savedSet.has(String(item._id))
        }));

        res.status(200).json({
            message: 'Food items retrieved successfully',
            foodItems: enrichedFoodItems,
            isAuthenticated
        }); 
    }
    catch (error) {
        console.error('Error getting food items:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Internal server error'
        });
    }
}


async function likedFoodItems(req, res) {
    try {
        const { foodId } = req.body;
        const actorId = req.user?._id || req.user || req.foodpartner?._id || req.foodpartner;

        if (!foodId || !actorId) {
            return res.status(400).json({ message: 'Food and user are required' });
        }

        const isAlreadyLiked = await likemodel.findOne({
            food: foodId,
            user: actorId
        });

        if (isAlreadyLiked) {
            await likemodel.deleteOne({ _id: isAlreadyLiked._id });
            await foodmodel.findByIdAndUpdate(foodId, { $inc: { likeCount: -1 } });
            return res.status(200).json({ message: 'Food item unliked successfully' });
        }

        const like = await likemodel.create({
            food: foodId,
            user: actorId
        });

        await foodmodel.findByIdAndUpdate(foodId, { $inc: { likeCount: 1 } });
        res.status(201).json({ message: 'Food item liked successfully', like });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle like', error: error.message });
    }
}

async function savedFoodItems(req, res) {
    try {
        const { foodId } = req.body;
        const actorId = req.user?._id || req.user || req.foodpartner?._id || req.foodpartner;

        if (!foodId || !actorId) {
            return res.status(400).json({ message: 'Food and user are required' });
        }

        const isAlreadySaved = await savemodel.findOne({
            food: foodId,
            user: actorId
        });

        if (isAlreadySaved) {
            await savemodel.deleteOne({ _id: isAlreadySaved._id });
            await foodmodel.findByIdAndUpdate(foodId, { $inc: { saveCount: -1 } });
            return res.status(200).json({ message: 'Food item unsaved successfully' });
        }

        const save = await savemodel.create({
            food: foodId,
            user: actorId
        });
        await foodmodel.findByIdAndUpdate(foodId, { $inc: { saveCount: 1 } });

        res.status(201).json({ message: 'Food item saved successfully', save });
    } catch (error) {
        res.status(500).json({ message: 'Failed to toggle save', error: error.message });
    }
}

async function getSavedFoodItems(req, res) {
    try {
        const actorId = req.user?._id || req.user || req.foodpartner?._id || req.foodpartner;

        if (!actorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const savedDocs = await savemodel.find({ user: actorId }).populate('food').lean();
        const foodItems = savedDocs
            .map((entry) => entry.food)
            .filter((item) => Boolean(item));

        if (!foodItems.length) {
            return res.status(200).json({
                message: 'Saved food items retrieved successfully',
                foodItems: []
            });
        }

        const foodIds = foodItems.map((item) => item._id);
        const [likedDocs, commentCounts] = await Promise.all([
            likemodel.find({ food: { $in: foodIds }, user: actorId }).select('food').lean(),
            commentmodel.aggregate([
                { $match: { food: { $in: foodIds } } },
                { $group: { _id: '$food', count: { $sum: 1 } } }
            ])
        ]);
        const likedSet = new Set(likedDocs.map((entry) => String(entry.food)));
        const savedSet = new Set(foodIds.map((id) => String(id)));
        const commentCountMap = new Map(commentCounts.map((entry) => [String(entry._id), entry.count]));

        const enrichedFoodItems = foodItems.map((item) => ({
            ...item,
            likeCount: typeof item.likeCount === 'number' ? item.likeCount : 0,
            saveCount: typeof item.saveCount === 'number' ? item.saveCount : 0,
            commentCount: commentCountMap.get(String(item._id)) || 0,
            isLiked: likedSet.has(String(item._id)),
            isSaved: savedSet.has(String(item._id))
        }));

        res.status(200).json({
            message: 'Saved food items retrieved successfully',
            foodItems: enrichedFoodItems
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch saved items', error: error.message });
    }
}

async function getFoodComments(req, res) {
    try {
        const foodId = req.params.foodId;
        if (!foodId) {
            return res.status(400).json({ message: 'Food is required' });
        }
        const comments = await commentmodel.find({ food: foodId }).sort({ createdAt: 1 }).populate('user', 'fullname').lean();
        res.status(200).json({ comments });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch comments', error: error.message });
    }
}

async function addFoodComment(req, res) {
    try {
        const foodId = req.params.foodId;
        const actorId = req.user?._id || req.user || req.foodpartner?._id || req.foodpartner;
        const bodyContent = req.body && typeof req.body.content === 'string' ? req.body.content.trim() : '';
        if (!foodId) {
            return res.status(400).json({ message: 'Food is required' });
        }
        if (!actorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!bodyContent) {
            return res.status(400).json({ message: 'Comment is required' });
        }
        const comment = await commentmodel.create({
            food: foodId,
            user: actorId,
            content: bodyContent,
        });
        const populated = await comment.populate({ path: 'user', select: 'fullname' });
        const count = await commentmodel.countDocuments({ food: foodId });
        res.status(201).json({ message: 'Comment added successfully', comment: populated, count });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add comment', error: error.message });
    }
}

async function getRelatedFoods(req, res) {
    try {
        const { foodId } = req.params;
        const food = await foodmodel.findById(foodId);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }

        // Enhanced recommendation algorithm
        let relatedFoods = [];

        // First priority: Foods with shared tags (exact matches)
        if (food.tags && food.tags.length > 0) {
            const tagMatches = await foodmodel.find({
                _id: { $ne: foodId },
                tags: { $in: food.tags }
            }).sort({ likeCount: -1, saveCount: -1 }).limit(8);

            relatedFoods = [...tagMatches];
        }

        // Second priority: Foods in the same category (if we don't have enough tag matches)
        if (relatedFoods.length < 6 && food.category) {
            const categoryMatches = await foodmodel.find({
                _id: { $ne: foodId },
                category: food.category,
                tags: { $nin: food.tags || [] } // Exclude already found items
            }).sort({ likeCount: -1, saveCount: -1 }).limit(6 - relatedFoods.length);

            relatedFoods = [...relatedFoods, ...categoryMatches];
        }

        // Remove duplicates and limit to 6 items
        const uniqueFoods = relatedFoods.filter((food, index, self) =>
            index === self.findIndex(f => f._id.toString() === food._id.toString())
        ).slice(0, 6);

        res.json({ relatedFoods: uniqueFoods });
    } catch (error) {
        console.error('Error fetching related foods:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateFood(req, res) {
    try {
        const foodId = req.params.id;
        const foodItem = await foodmodel.findById(foodId);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Check if the food partner owns this item
        if (foodItem.foodpartner.toString() !== req.foodpartner._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this food item' });
        }

        let fileUploadResult = foodItem.video; // Keep existing video by default
        if (req.file) {
            const { v4: uuid } = await import('uuid');
            const fileName = `${uuid()}_${req.file.originalname}`;
            fileUploadResult = await storageServices.uploadFile(req.file, fileName);
            console.log('File upload result:', fileUploadResult);
        }

        const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : foodItem.tags;

        const updatedFoodItem = await foodmodel.findByIdAndUpdate(
            foodId,
            {
                name: req.body.name || foodItem.name,
                discription: req.body.discription || foodItem.discription,
                category: req.body.category || foodItem.category,
                tags,
                price: req.body.price || foodItem.price,
                availableQuantity: req.body.availableQuantity || foodItem.availableQuantity,
                video: fileUploadResult.url || fileUploadResult
            },
            { new: true }
        );

        res.status(200).json({
            message: 'Food updated successfully',
            food: updatedFoodItem
        });

    } catch (error) {
        console.error('Error updating food:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

async function deleteFood(req, res) {
    try {
        const foodId = req.params.id;
        const foodItem = await foodmodel.findById(foodId);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // Check if the food partner owns this item
        if (foodItem.foodpartner.toString() !== req.foodpartner._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this food item' });
        }

        // Delete associated likes, saves, and comments
        await Promise.all([
            likemodel.deleteMany({ food: foodId }),
            savemodel.deleteMany({ food: foodId }),
            commentmodel.deleteMany({ food: foodId })
        ]);

        // Delete the food item
        await foodmodel.findByIdAndDelete(foodId);

        res.status(200).json({
            message: 'Food item deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting food:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

module.exports = {
    createFood,
    updateFood,
    deleteFood,
    getFoodItem,
    getAllFoodItems,
    likedFoodItems,
    savedFoodItems,
    getSavedFoodItems,
    getFoodComments,
    addFoodComment,
    getRelatedFoods
}; 
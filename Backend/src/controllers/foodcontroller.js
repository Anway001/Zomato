const foodmodel = require('../models/foodmodel');
const likemodel = require('../models/likemodel');
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
        const foodItem = await foodmodel.create({
            name : req.body.name,
            discription : req.body.discription,
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


async function getAllFoodItems (req, res) {
    try {
        const foodItems = await foodmodel.find({})
        res.status(200).json({
            message: 'Food items retrieved successfully',
            foodItems: foodItems
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
    const { foodId } = req.body;
    const userId = req.user; 

    const isAlreadyLiked = await likemodel.findOne({
         food: foodId,
          user: userId
        });
    if (isAlreadyLiked) {
        await likemodel.deleteOne({ _id: isAlreadyLiked._id });
        await foodmodel.findByIdAndUpdate(foodId, 
            { $inc: {  likeCount: -1} 
        });
        return res.status(200).json({ message: 'Food item unliked successfully' });
    }


   const like = await likemodel.create({
        food: foodId,
        user: userId
    });

    await foodmodel.findByIdAndUpdate(foodId, 
        { $inc: {  likeCount: 1} 
    });
    res.status(201).json({ message: 'Food item liked successfully', like });
}

async function savedFoodItems(req, res) {

    const { foodId } = req.body;
    const userId = req.user;

    const isAlreadySaved = await savemodel.findOne({
        food: foodId,
        user: userId
    });

    if (isAlreadySaved) {
        await savemodel.deleteOne({ _id: isAlreadySaved._id });
        return res.status(200).json({ message: 'Food item unsaved successfully' });
    }

    const save = await savemodel.create({
        food: foodId,
        user: userId
    });

    res.status(201).json({ message: 'Food item saved successfully', save });
}

module.exports = { 
    createFood,
    getAllFoodItems,
    likedFoodItems,
    savedFoodItems  
}; 
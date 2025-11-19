const userModel = require('../models/usermodel');
const foodPartnerModel = require('../models/foodpatnermodules');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
// User Controllers
async function registerUser(req, res) {
    try{
        const {fullname, email, password} = req.body;
        const existingUser = await userModel.findOne({email: email});
        if(existingUser){
            return  res.status(400).json({message:"User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            fullname: fullname,
            email: email,
            password: hashedPassword,
        }); 
        await newUser.save();

        const token = jwt.sign({
            userId: newUser._id,
        }, JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({message:"User registered successfully", 
            user:{
                    id : newUser._id,
                    email : newUser.email,
                    fullname : newUser.fullname

                }, token:token});  
        
         
    }
    catch(error){
        res.status(500).json({message:"Error registering user", error:error.message});
        console.log(error.message);
    }
}


async function LoginUser(req,res){
    try{
        const {email, password} = req.body;
        const user = await userModel.findOne({email: email});
        if(!user){
            return res.status(400).json({message:"Invalid email or password"});
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid email or password"});
        }
        const token = jwt.sign({
            userId: user._id,
        }, JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({message:"User logged in successfully", 
            user:{
                    id : user._id,
                    email : user.email,
                    fullname : user.fullname

                }, token:token});  

    }catch(err){
        res.status(500).json({message:"Error logging in user", err})
        console.log(err);
    }
}

function logoutUser(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.status(200).json({message: "User logged out successfully"});
}

// Food Partner Controllers
async function registerFoodPartner(req, res) {
    try{
        const {name, email, password,phone , address , contactName} = req.body;
        const existingPartner = await foodPartnerModel.findOne({email: email});
        if(existingPartner){
            return  res.status(400).json({message:"Food Partner already exists"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPartner = await foodPartnerModel.create({
            name: name,
            email: email,    
            password: hashedPassword,
            phone: phone,
            address: address,
            contactName: contactName
        });
        res.status(201).json({message:"Food Partner registered successfully", partner:newPartner});
    

    const token = jwt.sign({
            id: newPartner._id,
        }, JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({message:"Food Partner registered successfully", 
            partner:{
                    id : newPartner._id,
                    email : newPartner.email,
                    name : newPartner.name

                }, token:token});  


    }
    catch(error){
        res.status(500).json({message:"Error registering Food Partner", error:error.message});
        console.log(error.message);
    }
}

async function loginFoodPartner(req,res){
    try{
        const {email, password} = req.body;
        const partner = await foodPartnerModel.findOne({email: email});
        if(!partner){
            return res.status(400).json({message:"Invalid email or password"});
        }
        const isPasswordValid = await bcrypt.compare(password, partner.password);
        if(!isPasswordValid){
            return res.status(400).json({message:"Invalid email or password"});
        }
        const token = jwt.sign({
            id: partner._id,
        }, JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({message:"Food Partner logged in successfully", 
            partner:{
                    id : partner._id,
                    email : partner.email,
                    name : partner.name

                }, token:token});  

    }catch(err){
        res.status(500).json({message:"Error logging in Food Partner", err})
        console.log(err);
    }

}
function logoutFoodPartner(req, res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.status(200).json({message: "Food Partner logged out successfully"});
}

async function getCurrentUser(req, res) {
    try {
        // The anyAuthMiddleware should have set req.user or req.foodpartner
        if (req.user) {
            const user = req.user.toObject();
            delete user.password;
            return res.status(200).json({
                message: "Current user fetched successfully",
                user: user,
                type: "user"
            });
        } else if (req.foodpartner) {
            const partner = req.foodpartner.toObject();
            delete partner.password;
            return res.status(200).json({
                message: "Current food partner fetched successfully",
                partner: partner,
                type: "foodpartner"
            });
        } else {
            return res.status(401).json({ message: "Not authenticated" });
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: "Error fetching current user" });
    }
}

module.exports = {registerUser
, LoginUser
, logoutUser
, registerFoodPartner
, loginFoodPartner
, logoutFoodPartner
, getCurrentUser
};
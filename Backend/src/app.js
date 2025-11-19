require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authrouter = require('./routes/authrouter');
const foodrouter = require('./routes/foodroutes');
const foodpartnerrouter = require('./routes/foodpartnerroutes');
const followrouter = require('./routes/follow.router');
const orderroutes = require('./routes/orderroutes');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: ['http://localhost:5173', 'https://reel-cart.vercel.app'],

    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Welcome to the Zomato Clone API');
});

app.use('/api/auth', authrouter);
app.use('/api/food', foodrouter);
app.use('/api/foodpartner', foodpartnerrouter);
app.use('/api/follow', followrouter);
app.use('/api/orders', orderroutes);
module.exports = app;
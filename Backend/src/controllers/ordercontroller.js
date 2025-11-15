const orderModel = require('../models/ordermodel');
const foodmodel = require('../models/foodmodel');

async function createOrder(req, res) {
    try {
        const { items, deliveryAddress } = req.body;
        const userId = req.user._id;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }

        if (!deliveryAddress || !deliveryAddress.trim()) {
            return res.status(400).json({ error: 'Delivery address is required' });
        }

        let totalAmount = 0;
        const orderItems = [];

        // Validate items and calculate total
        for (const item of items) {
            const food = await foodmodel.findById(item.food);
            if (!food) {
                return res.status(404).json({ error: `Food item ${item.food} not found` });
            }
            if (food.availableQuantity < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${food.name}. Available: ${food.availableQuantity}` });
            }
            const price = food.price;
            orderItems.push({
                food: item.food,
                quantity: item.quantity,
                price: price
            });
            totalAmount += price * item.quantity;
        }

        // Create order
        const order = await orderModel.create({
            user: userId,
            items: orderItems,
            totalAmount,
            deliveryAddress
        });

        // Decrement stock atomically
        for (const item of orderItems) {
            await foodmodel.findByIdAndUpdate(item.food, {
                $inc: { availableQuantity: -item.quantity }
            });
        }

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

async function getUserOrders(req, res) {
    try {
        const userId = req.user._id;
        const orders = await orderModel.find({ user: userId })
            .populate('items.food')
            .sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getOrderDetails(req, res) {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        const order = await orderModel.findOne({ _id: orderId, user: userId })
            .populate('items.food');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function getPartnerOrders(req, res) {
    try {
        const partnerId = req.foodpartner._id;
        // Find orders where items belong to this partner
        const orders = await orderModel.find({})
            .populate({
                path: 'items.food',
                match: { foodpartner: partnerId }
            })
            .populate('user', 'fullname email')
            .sort({ createdAt: -1 });
        // Filter orders that have at least one item from this partner
        const partnerOrders = orders.filter(order =>
            order.items.some(item => item.food && item.food.foodpartner.toString() === partnerId.toString())
        );
        res.json({ orders: partnerOrders });
    } catch (error) {
        console.error('Error fetching partner orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const partnerId = req.foodpartner._id;

        // Verify the order belongs to this partner
        const order = await orderModel.findById(orderId).populate('items.food');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const hasPartnerItems = order.items.some(item =>
            item.food.foodpartner.toString() === partnerId.toString()
        );
        if (!hasPartnerItems) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        order.status = status;
        await order.save();
        res.json({ message: 'Order status updated', order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderDetails,
    getPartnerOrders,
    updateOrderStatus
};
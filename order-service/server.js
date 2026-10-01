require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
mongoose
  .connect(dbUri)
  .then(() => console.log('Connected to Order MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Service URLs configured via environment variables
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// 1. GET ALL ORDERS
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving orders' });
  }
});

// 2. GET ORDER BY ID
app.get('/orders/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving order' });
  }
});

// 3. CREATE ORDER (POST) - Communicates with User & Product Services
app.post('/orders', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: 'Validation Failed', details: ['userId, productId, and quantity are required'] });
    }

    // Call User Service to validate user
    let userResponse;
    try {
      userResponse = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, { timeout: 3000 });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ error: 'Validation Failed', details: [`User with ID ${userId} not found`] });
      }
      return res.status(503).json({ error: 'Service Unavailable', details: 'User service is currently unavailable' });
    }

    // Call Product Service to validate product and calculate price
    let productResponse;
    try {
      productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`, { timeout: 3000 });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({ error: 'Validation Failed', details: [`Product with ID ${productId} not found`] });
      }
      return res.status(503).json({ error: 'Service Unavailable', details: 'Product service is currently unavailable' });
    }

    const product = productResponse.data;
    const totalPrice = product.price * quantity;

    const newOrder = new Order({
      userId,
      productId,
      quantity,
      totalPrice,
      status: 'CONFIRMED',
    });

    const savedOrder = await newOrder.save();
    res.status(201).json({
      order: savedOrder,
      userDetails: userResponse.data,
      productDetails: product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});
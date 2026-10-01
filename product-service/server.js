require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
mongoose
  .connect(dbUri)
  .then(() => console.log('Connected to Product MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

function validateProduct(data) {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Product name is required');
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
    errors.push('Description is required');
  }
  if (data.price === undefined || typeof data.price !== 'number' || data.price < 0) {
    errors.push('Valid price is required');
  }
  if (data.stock === undefined || typeof data.stock !== 'number' || data.stock < 0) {
    errors.push('Valid stock amount is required');
  }
  return errors;
}

// REST Endpoints for Products
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving products' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving product' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const errors = validateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Failed', details: errors });
    }
    const newProduct = new Product({
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      price: req.body.price,
      stock: req.body.stock,
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const errors = validateProduct(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Failed', details: errors });
    }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        price: req.body.price,
        stock: req.body.stock,
      },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json({ message: `Product with ID ${req.params.id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});
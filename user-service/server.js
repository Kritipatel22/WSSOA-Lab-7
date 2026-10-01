require('dotenv').config();

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dbUri = process.env.MONGO_URI || process.env.MONGODB_URI;
mongoose
  .connect(dbUri)
  .then(() => console.log('Connected to User MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

function validateUser(data) {
  const errors = [];
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Name is required and cannot be blank');
  }
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('A valid email is required');
  }
  if (!data.course || typeof data.course !== 'string' || data.course.trim() === '') {
    errors.push('Course is required');
  }
  if (data.semester === undefined || typeof data.semester !== 'number' || data.semester < 1) {
    errors.push('Semester must be a positive number greater than 0');
  }
  return errors;
}

// REST Endpoints for Users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving users' });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving user' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const errors = validateUser(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Failed', details: errors });
    }
    const newUser = new User({
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      course: req.body.course.trim(),
      semester: req.body.semester,
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Validation Failed', details: ['A user with this email already exists'] });
    }
    res.status(400).json({ error: error.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    const errors = validateUser(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation Failed', details: errors });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name.trim(),
        email: req.body.email.trim(),
        course: req.body.course.trim(),
        semester: req.body.semester,
      },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Validation Failed', details: ['A user with this email already exists'] });
    }
    res.status(400).json({ error: error.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: `User with ID ${req.params.id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});
const mongoose = require('mongoose');
const { env } = require('./env');

async function connectDB() {
  if (!env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in environment');
  }
  await mongoose.connect(env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  // Optional: configure mongoose connection events
  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error', err));
}

module.exports = { connectDB };

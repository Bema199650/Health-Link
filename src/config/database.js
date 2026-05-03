const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthlink_malawi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log('⚠️ MongoDB not available, using in-memory storage');
    console.log('To use MongoDB, install it or use MongoDB Atlas (free)');
    return null;
  }
};

module.exports = connectDB
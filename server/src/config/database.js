import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-observability';
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected successfully');
    
    // Create indexes on startup
    await createIndexes();
  } catch (error) {
    console.error('[DB] Connection error:', error.message);
    // In dev mode with no MongoDB, we'll use in-memory storage
    console.warn('[DB] Falling back to in-memory mock storage');
    return false;
  }
  return true;
};

const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    // Metrics indexes for time-series queries
    await db.collection('metrics').createIndex({ modelId: 1, timestamp: -1 });
    await db.collection('metrics').createIndex({ type: 1, timestamp: -1 });
    await db.collection('metrics').createIndex({ timestamp: -1 });
    // Alerts indexes
    await db.collection('alerts').createIndex({ status: 1, severity: 1 });
    await db.collection('alerts').createIndex({ modelId: 1, createdAt: -1 });
    // Audit logs indexes
    await db.collection('auditlogs').createIndex({ userId: 1, timestamp: -1 });
    await db.collection('auditlogs').createIndex({ action: 1, timestamp: -1 });
    console.log('[DB] Indexes created successfully');
  } catch (err) {
    console.warn('[DB] Index creation skipped:', err.message);
  }
};

export default connectDB;

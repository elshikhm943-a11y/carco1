const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// تحميل المتغيرات من .env
dotenv.config();

const app = express();

// إعداد CORS – واحد بس كافي
app.use(cors({
  origin: true,                           // allow all origins for dev (different localhost ports)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// معالجة البيانات
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// مسار اختباري
app.get('/', (req, res) => {
  res.status(200).json({
    message: "Backend is Live! 🚀",
    note: "CORS should be working now for Angular dev server"
  });
});

// روابط API
// --- استبدل الجزء القديم بالجديد ده ---
app.use('/api/cars', require('./routers/cars'));      // كانت cars (صح)
app.use('/api/carsuser', require('./routers/caruser')); // عدلها لـ carsuser (عشان الـ Service في الأنجولار)
app.use('/api/orders', require('./routers/order'));    // عدلها لـ orders (بالجمع)
app.use('/api/users', require('./routers/user'));     // عدلها لـ users (بالجمع)

// إعدادات Port و MongoDB
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in .env!");
  process.exit(1);
}

// الاتصال بـ MongoDB وتشغيل السيرفر
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Successfully');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Access it at: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy: Origin not allowed' });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});
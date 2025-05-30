const express = require("express");
const cors = require("cors");
const passport = require('passport');
require("dotenv").config();

// استيراد إعدادات Passport
const passportConfig = require('./config/passport');

// استيراد المسارات
const userRoutes = require('./routes/userRoutes');

const app = express();

// تكوين CORS للسماح بالطلبات من الواجهة الأمامية
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://lvpfhxxu.manus.space',
  credentials: true
}));

app.use(express.json());

// تهيئة Passport
app.use(passport.initialize());

// تفعيل مسارات المستخدمين
app.use('/api/users', userRoutes);

// مسار للتحقق من صحة الخادم
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "FitMind API is healthy ✅",
    environment: process.env.NODE_ENV,
    googleOAuthEnabled: !!process.env.GOOGLE_CLIENT_ID,
    clientUrl: process.env.CLIENT_URL
  });
});

// مسار اختبار لـ Google OAuth
app.get("/api/oauth-test", (req, res) => {
  res.json({
    googleOAuthUrl: `${req.protocol}://${req.get('host')}/api/users/auth/google`,
    googleClientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
    passportInitialized: !!passport
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Google OAuth enabled: ${!!process.env.GOOGLE_CLIENT_ID}`);
  console.log(`Client URL: ${process.env.CLIENT_URL}`);
});

const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const passport = require('passport');

// مسار تسجيل مستخدم جديد
router.post('/register', registerUser);

// مسار تسجيل الدخول
router.post('/login', loginUser);

// مسارات مصادقة Google
router.get('/auth/google', 
  (req, res, next) => {
    console.log('تم استدعاء مسار Google OAuth');
    next();
  },
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

router.get(
  '/auth/google/callback',
  (req, res, next) => {
    console.log('تم استدعاء مسار استجابة Google OAuth');
    next();
  },
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/login' 
  }),
  (req, res) => {
    try {
      console.log('تمت المصادقة بنجاح مع Google:', req.user);
      
      // إنشاء توكن JWT
      const { generateToken } = require('../config/passport');
      const token = generateToken(req.user);
      
      // توجيه المستخدم إلى الواجهة الأمامية مع التوكن
      const redirectUrl = `${process.env.CLIENT_URL || 'https://lvpfhxxu.manus.space'}/#/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`;
      console.log('إعادة توجيه إلى:', redirectUrl);
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('خطأ في معالجة استجابة Google OAuth:', error);
      res.redirect(`${process.env.CLIENT_URL || 'https://lvpfhxxu.manus.space'}/#/login?error=auth_failed`);
    }
  }
);

module.exports = router;

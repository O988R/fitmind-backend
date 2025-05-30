const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../models/userModel');
const bcrypt = require('bcryptjs');

// إعداد استراتيجية Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/users/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google profile:', profile);
        
        // البحث عن المستخدم بواسطة البريد الإلكتروني
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        
        if (!email) {
          return done(new Error('لم يتم العثور على بريد إلكتروني في حساب Google'), null);
        }
        
        let user = await findUserByEmail(email);

        // إذا لم يكن المستخدم موجوداً، قم بإنشاء مستخدم جديد
        if (!user) {
          // تشفير كلمة مرور عشوائية (لن تستخدم للدخول، فقط للتوافق مع النموذج)
          const randomPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(randomPassword, 10);

          // إنشاء مستخدم جديد
          user = await createUser(
            profile.displayName || email.split('@')[0],
            email,
            hashedPassword
          );
        }

        // إرجاع معلومات المستخدم
        return done(null, {
          id: user.id,
          name: user.name,
          email: user.email
        });
      } catch (error) {
        console.error('خطأ في استراتيجية Google OAuth:', error);
        return done(error, null);
      }
    }
  )
);

// تكوين Passport للتعامل مع الجلسات
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// دالة لإنشاء توكن JWT بعد المصادقة الناجحة
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'fitmind_jwt_secret',
    { expiresIn: '30d' }
  );
};

module.exports = {
  passport,
  generateToken
};

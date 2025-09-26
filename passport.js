// passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// جاهز مستقبلاً: const FacebookStrategy = require("passport-facebook").Strategy;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// موديلات المستخدم
const {
  findUserByEmail,
  createUser,
  findUserById, // تأكد إنه موجود فعلاً داخل models/userModel
} = require("./models/userModel");

// ===== Google OAuth =====
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallback =
  process.env.GOOGLE_CALLBACK_URL || "/api/users/auth/google/callback";

if (googleClientId && googleClientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallback,
        proxy: true, // مهم على Render/Vercel
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // إحضر الإيميل
          const email =
            (profile.emails && profile.emails[0] && profile.emails[0].value) ||
            "";

          if (!email) {
            return done(
              new Error("لم يتم العثور على بريد إلكتروني في حساب Google"),
              null
            );
          }

          // دور على المستخدم
          let user = await findUserByEmail(email);

          // إذا مش موجود أنشئ واحد جديد
          if (!user) {
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await createUser(
              profile.displayName || email.split("@")[0],
              email,
              hashedPassword
            );
          }

          // رجّع بيانات مختصرة
          return done(null, {
            id: user.id || user._id?.toString(),
            name: user.name,
            email: user.email,
          });
        } catch (err) {
          console.error("خطأ في Google OAuth:", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn(
    "[Passport] GOOGLE_CLIENT_ID/SECRET غير مهيّئين، سيتم تعطيل تسجيل الدخول عبر Google."
  );
}

// ⚠️ لا نحتاج serialize/deserialize لو session=false
passport.serializeUser?.((user, done) => done(null, user.id));
passport.deserializeUser?.(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (e) {
    done(e, null);
  }
});

// توليد JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "fitmind_jwt_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "30d" }
  );
}

// نصدّر passport نفسه + نعلّق عليه التوكن كخاصية
passport.generateToken = generateToken;

module.exports = passport;

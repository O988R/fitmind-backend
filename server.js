// server.js
const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();

// إعدادات Passport
require("./config/passport");

// مسارات المستخدمين
const userRoutes = require("./routes/userRoutes");

const app = express();

/* =========================
   CORS (دعم عدة أصول)
   - استخدم CORS_ORIGINS أو CLIENT_URL (مفصولة بفواصل)
   ========================= */
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // السماح لطلبات السيرفر-سيرفر أو Postman (بدون Origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.set("trust proxy", true); // جيد خلف بروكسيات الاستضافة

// تهيئة Passport
app.use(passport.initialize());

// ربط المسارات تحت /api
app.use("/api/users", userRoutes);

/* =========================
   Health Checks
   ========================= */
// مختصر
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    service: "fitmind-backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// مفصل تحت /api
app.get("/api/health", (req, res) => {
  res.json({
    message: "FitMind API is healthy ✅",
    environment: process.env.NODE_ENV,
    googleOAuthEnabled: !!process.env.GOOGLE_CLIENT_ID,
    clientUrl: process.env.CLIENT_URL || null,
    uptime: process.uptime(),
  });
});

// اختبار Google OAuth (اختياري)
app.get("/api/oauth-test", (req, res) => {
  const host = `${req.protocol}://${req.get("host")}`;
  res.json({
    googleOAuthUrl: `${host}/api/users/auth/google`,
    googleClientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
    googleClientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
    passportInitialized: !!passport,
  });
});

// مسار افتراضي
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "fitmind-backend" });
});

// 404 handler بسيط
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ") || "(any)"}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || "(none)"}`);
});

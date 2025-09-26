// server.js
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// إعدادات Passport
require("./config/passport");

// مسارات المستخدمين والتمارين
const userRoutes = require("./routes/userRoutes");
const workoutRoutes = require("./routes/workoutRoutes");

const app = express();

// أمان وأداء
app.use(helmet());
app.use(compression());

// CORS (عدة أصول)
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "")
  .split(",").map(s => s.trim()).filter(Boolean);

const corsMiddleware = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/Server-to-Server
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    const err = new Error(`Not allowed by CORS: ${origin}`);
    err.status = 403;
    return cb(err);
  },
  credentials: true,
  methods: "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
});
app.use(corsMiddleware);
app.options("*", corsMiddleware);

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);

// Passport
app.use(passport.initialize());

// Rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/workouts", workoutRoutes);

// Health Checks
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "fitmind-backend", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.get("/health", (_req, res) => {
  res.json({ message: "FitMind API is healthy ✅", uptime: process.uptime() });
});
app.get("/api/health", (_req, res) => {
  res.json({
    message: "FitMind API is healthy ✅",
    environment: process.env.NODE_ENV,
    clientUrl: process.env.CLIENT_URL || null,
    uptime: process.uptime(),
  });
});

// Root
app.get("/", (_req, res) => res.json({ ok: true, service: "fitmind-backend" }));

// Error handling
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server Error" });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ") || "(any)"}`);
});

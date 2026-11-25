const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FIGMA_PUBLIC_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

module.exports = cors({
  origin: (origin, cb) => {
    // no origin = curl/Postman/server-to-server, allow
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
});
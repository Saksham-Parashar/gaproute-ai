const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

/* Require all the routes here */
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

/* Using all the routes here */
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

/* Global JSON error handler (catches Multer file size/type errors cleanly) */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Resume PDF must be 3 MB or smaller.",
      });
    }
    return res.status(400).json({
      message: err.message || "File upload error.",
    });
  }

  if (err) {
    return res.status(err.status || 500).json({
      message: err.message || "Internal server error.",
    });
  }

  next();
});

module.exports = app;

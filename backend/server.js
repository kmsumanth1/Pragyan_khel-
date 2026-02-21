const express = require("express");
const axios = require("axios");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = "SUPER_SECRET_KEY";

/* =====================================================
   TEMP IN-MEMORY STORE (Use DB in production)
===================================================== */
const resetTokens = {};

/* =====================================================
   PROXY STREAM
===================================================== */
app.get("/proxy", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("No URL provided");
  }

  try {
    const response = await axios.get(url, {
      responseType: "stream",
    });

    response.data.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).send("Stream failed");
  }
});

/* =====================================================
   LOGIN (Demo)
===================================================== */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (email && password) {
    const token = jwt.sign({ email }, SECRET, {
      expiresIn: "1h",
    });

    return res.json({ token });
  }

  res.status(400).json({ message: "Invalid credentials" });
});

/* =====================================================
   FORGOT PASSWORD
===================================================== */
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  try {
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store token temporarily (should be DB in real app)
    resetTokens[resetToken] = {
      email,
      expires: Date.now() + 15 * 60 * 1000, // 15 mins
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "yourgmail@gmail.com", // replace
        pass: "APP_PASSWORD", // use Gmail App Password
      },
    });

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `
        <h3>Password Reset</h3>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ message: "Email sending failed" });
  }
});

/* =====================================================
   RESET PASSWORD
===================================================== */
app.post("/reset-password/:token", (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  const stored = resetTokens[token];

  if (!stored) {
    return res.status(400).json({ message: "Invalid token" });
  }

  if (Date.now() > stored.expires) {
    delete resetTokens[token];
    return res.status(400).json({ message: "Token expired" });
  }

  // In real app → update password in DB here

  delete resetTokens[token];

  res.json({ message: "Password reset successful" });
});

/* =====================================================
   START SERVER
===================================================== */
app.listen(5000, () => {
  console.log("Backend running on port 5000");
}); 
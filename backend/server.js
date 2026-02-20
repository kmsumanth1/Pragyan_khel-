const express = require("express");
const axios = require("axios");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = "SUPER_SECRET_KEY";

/* ================= PROXY STREAM ================= */
app.get("/proxy", async (req, res) => {
  const { url } = req.query;

  try {
    const response = await axios.get(url, {
      responseType: "stream"
    });
    response.data.pipe(res);
  } catch (err) {
    res.status(500).send("Stream failed");
  }
});

/* ================= LOGIN ================= */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Hackathon demo login
  if (email && password) {
    const token = jwt.sign(
      { email },
      SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } else {
    res.status(400).json({ message: "Invalid credentials" });
  }
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
}); 
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const users = []; // Temporary storage for users

// Register a new user
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).send("User registered successfully");
});

// Login and get a JWT token
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }
    const token = jwt.sign({ username }, "secretkey", { expiresIn: "1h" });
    res.json({ token });
});

// Start the authentication service
app.listen(4000, () => console.log("Auth Service running on port 4000"));

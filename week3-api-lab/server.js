const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const users = [];  // Temporary storage

app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    res.status(201).send("User registered");    
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }
    const token = jwt.sign({ username }, "secretkey", { expiresIn: "1h" });
    res.json({ token });
});

app.get("/api/protected", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Access denied");
    try {
        const decoded = jwt.verify(token, "secretkey");
        res.json({ message: "Protected content", user: decoded });
    } catch {
        res.status(401).send("Invalid token");
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));

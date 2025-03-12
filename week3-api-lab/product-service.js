const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

const products = [
    { id: 1, name: "Laptop", price: 50000 },
    { id: 2, name: "Smartphone", price: 25000 }
];

// Middleware to verify JWT Token
function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Access denied");

    try {
        req.user = jwt.verify(token, "secretkey");
        next();
    } catch {
        res.status(401).send("Invalid token");
    }
}

// Get all products (Protected Route)
app.get("/products", verifyToken, (req, res) => {
    res.json(products);
});

// Start the product service
app.listen(5001, () => console.log("Product Service running on port 5001"));

const express = require("express");
const app = express();
const path = require("path");

// Serve static files from frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.use(express.static(path.join(__dirname, "."))); 

// Start server
app.listen(3000, () => {
    console.log(`Server running at http://localhost:${3000}`);
});

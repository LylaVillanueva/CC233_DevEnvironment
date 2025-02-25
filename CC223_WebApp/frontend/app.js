function hide() {  
    document.getElementById("head-change").style.display = "none";
    document.getElementById("cat-img").style.display = "none";
}

function replace() {  
    fetchImage();  // Call function to update image
    document.getElementById("head-copy").style.display = "none"; 
    document.getElementById("head-change").style.display = "block";
    document.getElementById("lyla-img").style.display = "none"; 
    document.getElementById("cat-img").style.display = "block";
    document.getElementById("button").style.display = "none";
}

function fetchImage() {
    const imgElement = document.getElementById("catImage");  // Get the image element
    fetch("http://localhost:3000/cat.jpg", { method: "HEAD" }) // HEAD request checks if the image exists
        .then(response => {
            if (!response.ok) {
                console.error("Backend is not responding or image is missing!");
                return;
            }
            console.log("Backend connected, updating image...");
            imgElement.src = "http://localhost:3000/cat.jpg"; // Set new image if backend is available
        })
        .catch(error => {
            console.error("Failed to fetch image:", error);
    });
}

// Run hide() when page loads
window.onload = hide;

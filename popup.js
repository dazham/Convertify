// Ensure the DOM is fully loaded before executing the script
document.addEventListener("DOMContentLoaded", () => {
    // Select elements from the DOM
    const fileInput = document.getElementById("fileInput"); // File input element
    const fileDropArea = document.getElementById("fileDropArea"); // Drag-and-drop area
    const fileName = document.getElementById("fileName"); // Placeholder for file name
    const fileNameDisplay = document.getElementById("fileNameDisplay"); // Display chosen file name
    const filePreview = document.getElementById("filePreview"); // Image preview element
    const formatSelect = document.getElementById("formatSelect"); // Format dropdown selector
    const convertButton = document.getElementById("convertButton"); // Convert button
    const loadingBar = document.getElementById("loadingBar"); // Loading bar container
    const loadingProgress = document.getElementById("loadingProgress"); // Progress bar inside loading bar

    let originalFileName = ""; // Variable to store the original file name

    // Set the initial fileName text content to blank
    fileName.textContent = ""; 

    // Event listener for file selection via input
    fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0]; // Get the first selected file
        if (file) {
            originalFileName = file.name; // Store the original file name
            fileName.textContent = ""; // Clear any placeholder text
            fileNameDisplay.textContent = "File chosen: " + file.name; // Update file name display
            
            // Use FileReader to preview the image
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreview.src = e.target.result; // Set preview image source
                filePreview.style.display = "block"; // Display the image preview
            };
            reader.readAsDataURL(file); // Read file as Data URL
        } else {
            // Reset placeholders and hide preview if no file is chosen
            fileName.textContent = "";
            fileNameDisplay.textContent = "";
            filePreview.style.display = "none";
        }
    });

    // Drag-and-drop functionality
    fileDropArea.addEventListener("dragover", (event) => {
        event.preventDefault(); // Prevent default behavior
        fileDropArea.classList.add("hover"); // Add hover effect
    });

    fileDropArea.addEventListener("dragleave", () => {
        fileDropArea.classList.remove("hover"); // Remove hover effect
    });

    fileDropArea.addEventListener("drop", (event) => {
        event.preventDefault(); // Prevent default behavior
        fileDropArea.classList.remove("hover"); // Remove hover effect
        
        const files = event.dataTransfer.files; // Get the dropped files
        if (files.length > 0) {
            fileInput.files = files; // Assign the dropped file to the input
            originalFileName = files[0].name; // Store the original file name
            fileName.textContent = ""; // Clear placeholder text
            fileNameDisplay.textContent = "File chosen: " + files[0].name; // Update file name display
            
            // Use FileReader to preview the image
            const reader = new FileReader();
            reader.onload = (e) => {
                filePreview.src = e.target.result; // Set preview image source
                filePreview.style.display = "block"; // Display the image preview
            };
            reader.readAsDataURL(files[0]); // Read file as Data URL
        }
    });

    // Trigger file input click when the drop area is clicked
    fileDropArea.addEventListener("click", () => fileInput.click());

    // Event listener for the conversion process
    convertButton.addEventListener("click", async () => {
        const file = fileInput.files[0]; // Get the selected file
        const format = formatSelect.value; // Get the selected format

        // Ensure a file is chosen before proceeding
        if (!file) {
            alert("Please choose an image file.");
            return;
        }

        // Show the loading bar and reset progress
        loadingBar.style.display = "block";
        loadingProgress.style.width = "0%";

        // Use FileReader to read the file
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const img = new Image(); // Create a new image element
                img.src = event.target.result; // Set the source to the file content
                await img.decode(); // Wait for the image to load

                // Create a canvas to perform the conversion
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                // Set canvas dimensions and draw the image
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Convert canvas content to the selected format
                const dataURL = canvas.toDataURL(format);
                loadingProgress.style.width = "100%"; // Update progress bar

                // Generate a new file name with "Converted" prefix
                const newFileName = "Converted_" + 
                    originalFileName.split('.')[0] + "." + format.split("/")[1];

                // Create a download link and trigger download
                const link = document.createElement("a");
                link.href = dataURL;
                link.download = newFileName; // Set new file name
                link.click();

                // Hide the loading bar after a brief delay
                setTimeout(() => (loadingBar.style.display = "none"), 500);
            } catch (error) {
                // Handle errors during the conversion process
                alert("An error occurred during conversion.");
                loadingBar.style.display = "none"; // Hide loading bar
            }
        };

        reader.readAsDataURL(file); // Read the file as Data URL
    });
});

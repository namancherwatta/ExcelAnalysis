const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Endpoint to handle file upload and get all columns with data analysis
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Extract column names from the first row
    const columns = Object.keys(data[0] || {}); // Get all column names

    // Perform basic analysis on each column (e.g., category count)
    const categoryCounts = columns.reduce((acc, column) => {
      acc[column] = data.reduce((categoryAcc, row) => {
        const category = row[column];
        categoryAcc[category] = (categoryAcc[category] || 0) + 1;
        return categoryAcc;
      }, {});
      return acc;
    }, {});

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({ categoryCounts, columns }); // Send columns and empty category data initially
  } catch (error) {
    res.status(500).json({ error: 'Error processing the file' });
  }
});

// Endpoint to get category data for a selected column
app.post('/getCategoryData', (req, res) => {
  const { column } = req.body;
  
  // Get the corresponding data based on the selected column
  try {
    const categoryCounts = {}; // Calculate category counts for the selected column
    // Use data stored in memory or recompute
    // For simplicity, let's simulate the result
    categoryCounts[column] = { "Category 1": 10, "Category 2": 15, "Category 3": 5 };
    
    res.json({ categoryCounts });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching category data' });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

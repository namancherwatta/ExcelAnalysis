const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
const app = express();
const upload = multer({ dest: 'uploads/' });


app.use(express.json());
app.use(cors({
  origin: 'https://excel-analysis-18qn.vercel.app',methods:["GET","POST","PUT","DELETE"] // Replace with your frontend's URL
}));

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
    console.log(categoryCounts)
    res.json({ categoryCounts, columns }); // Send categoryCounts and columns together
  } catch (error) {
    res.status(500).json({ error: 'Error processing the file' });
  }
});

// New endpoint to handle comparison of two columns
app.post('/compare', upload.single('file'), (req, res) => {
  try {
    // Validate input from req.body
    const { column1, column2, metric } = req.body;
    if (!column1 || !column2 || !metric) {
      return res.status(400).json({ error: 'Missing column1, column2, or metric in request body' });
    }  

    // Read the uploaded file
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
    // Generic function to calculate metric-wise aggregation
    const calculateMetricAggregation = (data, column1, column2, metric) => {
      const aggregationResult = {};

      data.forEach((row) => {
        const value1 = row[column1]; // e.g., Product
        const value2 = row[column2]; // e.g., Region
        const metricValue = parseFloat(row[metric]); // e.g., TotalSales

        // Skip rows with invalid metric values
        if (isNaN(metricValue)) return;

        // Initialize the first level (column1) if it doesn't exist
        if (!aggregationResult[value1]) {
          aggregationResult[value1] = {};
        }

        // Initialize the second level (column2) if it doesn't exist
        if (!aggregationResult[value1][value2]) {
          aggregationResult[value1][value2] = 0;
        }

        // Add the metric value to the corresponding category
        aggregationResult[value1][value2] += metricValue;
      });

      return aggregationResult;
    };

    // Perform the aggregation using dynamic column names
    const result = calculateMetricAggregation(data, column1, column2, metric);

    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    // Send the result back to the client
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing the request' });
  }
});



// Start the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

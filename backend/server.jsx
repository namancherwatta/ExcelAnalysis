const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { log } = require('console');
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
    console.log(categoryCounts)
    res.json({ categoryCounts, columns }); // Send categoryCounts and columns together
  } catch (error) {
    res.status(500).json({ error: 'Error processing the file' });
  }
});

// New endpoint to handle comparison of two columns
app.post('/compare', upload.single('file'), (req, res) => {
  try {
    // Get selected columns for comparison
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Function to calculate region-wise sales for each product
    const calculateRegionSales = (data) => {
      const salesByProductAndRegion = {};

      // Iterate over the data
      data.forEach(row => {
        const { Product, Region, TotalSales } = row;
      console.log(Product,Region,TotalSales)
        // Ensure TotalSales is treated as a number
        const totalSales = parseFloat(TotalSales);

        // Skip rows where TotalSales is invalid (NaN)
        if (isNaN(totalSales)) return;

        // If the product doesn't exist in the sales object, initialize it
        if (!salesByProductAndRegion[Product]) {
          salesByProductAndRegion[Product] = {};
        }

        // If the region doesn't exist for this product, initialize it
        if (!salesByProductAndRegion[Product][Region]) {
          salesByProductAndRegion[Product][Region] = 0;
        }

        // Add the TotalSales to the corresponding product and region
        salesByProductAndRegion[Product][Region] += totalSales;
      });

      return salesByProductAndRegion;
    };

    // Calculate region-wise sales for each product
    const regionSalesData = calculateRegionSales(data);

    // Clean up uploaded file
    fs.unlinkSync(filePath);
  console.log(regionSalesData)
    // Send the region-wise sales data back to the frontend
    res.json({ regionSalesData });
  } catch (error) {
    res.status(500).json({ error: 'Error comparing columns' });
  }
});



// Start the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import './App.css';

const App = () => {
  const [data, setData] = useState(null); // Data for the selected column
  const [compareData, setCompareData] = useState(null); // Data for the comparison of two columns
  const [columns, setColumns] = useState([]); // Column names for dropdown
  const [selectedColumn, setSelectedColumn] = useState(''); // Selected column for categorization
  const [selectedColumn1, setSelectedColumn1] = useState(''); // Selected column 1 for comparison
  const [selectedColumn2, setSelectedColumn2] = useState(''); // Selected column 2 for comparisons
  const [categoryCounts, setCategoryCounts] = useState({}); // Holds all category counts

  // Handle file change and upload to backend
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData, // Use FormData to send the file
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      const { categoryCounts, columns } = result; // Expecting categoryCounts and columns from backend
      setColumns(columns); // Set column names
      setCategoryCounts(categoryCounts); // Set category counts for all columns
      setData(null); // Reset data until user selects a column
      setCompareData(null); // Reset comparison data
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle column selection for categorization
  const handleColumnChange = (e) => {
    const selected = e.target.value;
    setSelectedColumn(selected);

    // Filter the data for the selected column
    if (selected && categoryCounts[selected]) {
      const filteredData = Object.entries(categoryCounts[selected]).map(([key, value]) => ({
        category: key,
        count: value,
      }));
      setData(filteredData); // Set filtered data based on selected column
    } else {
      setData(null); // Reset data if no column selected
    }
  };

  // Handle column selection for comparison
  const handleCompareChange = async () => {
  
    if (selectedColumn1 && selectedColumn2) {
      const formData = new FormData();
      formData.append('file', document.querySelector('input[type="file"]').files[0]);
      formData.append('column1', selectedColumn1);
      formData.append('column2', selectedColumn2);
      try {
        const response = await fetch('http://localhost:3001/compare', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to compare columns');
        }
        const result = await response.json();
        // Transform the result into a format suitable for comparison
        const transformedData = transformComparisonData(result.regionSalesData);
        setCompareData(transformedData); // Set transformed data for comparison charts
      } catch (error) {
        console.error('Error comparing columns:', error);
      }
    }
  };

  // Function to download the chart as an image
  const downloadChart = async () => {
    try {
      const canvas = await html2canvas(document.getElementById("screenshotof"));
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error while downloading chart:', error);
    }
  };

  const transformComparisonData = (regionSalesData) => {
    const comparisonData = [];

    // Get all unique regions from the sales data
    const regions = Array.from(new Set(
      Object.values(regionSalesData).reduce((acc, widget) => [...acc, ...Object.keys(widget)], [])
    ));

    // For each region, build a data object for comparison
    regions.forEach(region => {
      const rowData = { region };

      Object.keys(regionSalesData).forEach(widget => {
        rowData[`${widget}_count`] = regionSalesData[widget][region] || 0; // Safely access region sales for each widget
      });

      comparisonData.push(rowData);
    });
    console.log(comparisonData)
    return comparisonData;
  };

  // Render all charts (Bar, Line, Pie) side by side
  const renderCharts = () => {
    if (!data || !selectedColumn) return null; // Don't render chart if no data or column is selected

    return (
      <div className="chart-container">
        {/* Bar Chart */}
        <div className="chart-item">
          <BarChart width={350} height={300} data={data} margin={{ top: 20, right: 20, bottom: 40, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>

        {/* Line Chart */}
        <div className="chart-item">
          <LineChart width={350} height={300} data={data} margin={{ top: 20, right: 20, bottom: 40, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </div>

        {/* Pie Chart */}
        <div className="chart-item">
          <PieChart width={350} height={300}>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8884d8' : '#82ca9d'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
          </PieChart>
        </div>
      </div>
    );
  };

  // Render comparison charts
  const renderComparisonCharts = () => {
    if (!compareData) return null; // Don't render comparison charts if no data is available

    return (
      <div className="chart-container">
        {/* Bar Chart for Comparison */}
        <div className="chart-item-compare">
          <BarChart width={350} height={300} data={compareData} margin={{ top: 20, right: 20, bottom: 40, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10 }} />
            <Tooltip />
            {console.log(selectedColumn1)}
            <Bar dataKey={`Widget A_count`} fill="#82ca9d" />
            <Bar dataKey={`Widget B_count`} fill="#8884d8" />
            <Bar dataKey={`Widget C_count`} fill="#544CE4" />
          </BarChart>
        </div>

        {/* Line Chart for Comparison */}
        <div className="chart-item-compare">
          <LineChart width={350} height={300} data={compareData} margin={{ top: 20, right: 20, bottom: 40, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey={`Widget A_count`} stroke="#8884d8" />
            <Line type="monotone" dataKey={`Widget B_count`} stroke="#82ca9d" />
            <Line type="monotone" dataKey={`Widget C_count`} stroke="#544CE4" />
            
          </LineChart>
        </div>

        {/* Pie Chart for Comparison */}
        {/* <div className="chart-item">
          <PieChart width={350} height={300}>
            <Pie
              data={compareData}
              dataKey={`Widget A_count`}
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
            />
            <Pie
              data={compareData}
              dataKey={`Widget B_count`}
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#82ca9d"
            />
             <Pie
              data={compareData}
              dataKey={`Widget C_count`}
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#544CE4"
            />
            <Tooltip />
          </PieChart>
        </div> */}
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Excel Data Analysis</h1>
      <p className="app-subtitle">Upload your Excel file and visualize the data with interactive charts!</p>

      <div className="file-input-container">
        <input type="file" onChange={handleFileChange} />
      </div>

      {/* Column Selection for Categorization */}
      <div className="column-selection">
        <label htmlFor="column">Choose Column to Categorize By:</label>
        <select
          id="column"
          value={selectedColumn}
          onChange={handleColumnChange}
        >
          <option value="">Select a column</option>
          {columns.map((column, index) => (
            <option key={index} value={column}>
              {column}
            </option>
          ))}
        </select>
      </div>


      <div id="screenshotof" className="chart-container">{renderCharts()}</div>
      {data && <button className="download-button" onClick={downloadChart}>Download Chart</button>}

      <div className="column-selection-compare" >
        <label htmlFor="column1">Select First Column to Compare:</label>
        <select
          id="column1"
          value={selectedColumn1}
          onChange={(e) => setSelectedColumn1(e.target.value)}
        >
          <option value="">Select first column</option>
          {columns.map((column, index) => (
            <option key={index} value={column}>
              {column}
            </option>
          ))}
        </select>

        <label htmlFor="column2">Select Second Column to Compare:</label>
        <select
          id="column2"
          value={selectedColumn2}
          onChange={(e) => setSelectedColumn2(e.target.value)}
        >
          <option value="">Select second column</option>
          {columns.map((column, index) => (
            <option key={index} value={column}>
              {column}
            </option>
          ))}
        </select>

        <button onClick={handleCompareChange}>Compare Columns</button>
      </div>
      <div id="screenshotof" className="chart-container">{renderComparisonCharts()}</div>


    </div>
  );
};

export default App;

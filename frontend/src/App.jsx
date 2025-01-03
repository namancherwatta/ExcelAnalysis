import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import './App.css';

const App = () => {
  const [data, setData] = useState(null); // Data for the selected column
  const [columns, setColumns] = useState([]); // Column names for dropdown
  const [selectedColumn, setSelectedColumn] = useState(''); // Selected column for categorization
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
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle column selection
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
  

  return (
    <div className="app-container">
      <h1 className="app-title">Excel Data Analysis</h1>
      <p className="app-subtitle">Upload your Excel file and visualize the data with interactive charts!</p>

      <div className="file-input-container">
        <input type="file" onChange={handleFileChange} />
      </div>

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
    </div>
  );
};

export default App;

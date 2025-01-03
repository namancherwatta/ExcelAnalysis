import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import './App.css';


const App = () => {
  const [data, setData] = useState(null);  // Data for the selected column
  const [chartType, setChartType] = useState('BarChart'); // Selected chart type
  const [columns, setColumns] = useState([]); // Column names for dropdown
  const [selectedColumn, setSelectedColumn] = useState(''); // Selected column for categorization
  const [categoryCounts, setCategoryCounts] = useState({}); // Holds all category counts
  // const chartRef = useRef(null);

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
    ; // Set a minimal delay to allow DOM rendering
  } catch (error) {
    console.error('Error while downloading chart:', error);
  }
};

  

  // Render chart based on the selected chart type
  const renderChart = () => {
    if (!data || !selectedColumn) return null; // Don't render chart if no data or column is selected

    switch (chartType) {
      case 'BarChart':
        return (
          <BarChart width={600} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        );
      case 'LineChart':
        return (
          <LineChart width={600} height={300} data={data} >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        );
      case 'PieChart':
        const colors = ['#8884d8', '#82ca9d', '#ffc658'];
        return (
          <PieChart width={400} height={400} >
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Excel Data Analysis</h1>
      <p className="app-subtitle">Upload your Excel file and visualize the data with interactive charts!</p>

      <div className="file-input-container">
        <input type="file" onChange={handleFileChange} />
      </div>

      <div className="chart-options">
        <label htmlFor="chartType">Choose Chart Type:</label>
        <select id="chartType" value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <option value="BarChart">Bar Chart</option>
          <option value="LineChart">Line Chart</option>
          <option value="PieChart">Pie Chart</option>
        </select>
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

      <div id="screenshotof"className="chart-container">{renderChart()}</div>

      {data && <button className="download-button" onClick={downloadChart}>Download Chart</button>}
    </div>
  );
};

export default App;

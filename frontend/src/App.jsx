import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import './App.css';


const App = () => {
  const backendURL=process.env.REACT_APP_BACK_END_URL;
  const [data, setData] = useState(null); // Data for the selected column
  const [compareData, setCompareData] = useState(null); // Data for the comparison of two columns
  const [columns, setColumns] = useState([]); // Column names for dropdown
  const [selectedColumn, setSelectedColumn] = useState(''); // Selected column for categorization
  const [selectedColumn1, setSelectedColumn1] = useState(''); // Selected column 1 for comparison
  const [selectedColumn2, setSelectedColumn2] = useState(''); // Selected column 2 for comparisons
  const [metric,setMetric]=useState('')
  const [categoryCounts, setCategoryCounts] = useState({}); // Holds all category counts

  // Handle file change and upload to backend
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(backendURL+'upload', {
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
      formData.append('metric',metric)
      try {
        const response = await fetch(backendURL+'compare', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to compare columns');
        }
        const result = await response.json();
        console.log(result)
        // Transform the result into a format suitable for comparison
        const transformedData = transformComparisonData(result);
        setCompareData(transformedData); // Set transformed data for comparison charts
      } catch (error) {
        console.error('Error comparing columns:', error);
      }
    }
  };
  const getDynamicColor = (index) => {
    const colors = ["#82ca9d", "#8884d8", "#544CE4", "#FFBB28", "#FF8042"];
    return colors[index % colors.length]; // Cycle through colors if needed
  };
  
  // Function to download the chart as an image
  const downloadChart = async (e) => {
    const classList = e.target.className.split(" "); // Split the class string into an array
    const secondClass = classList[1]; // Access the second class
    console.log(secondClass)
    try {
      const canvas = await html2canvas(document.getElementById(secondClass));
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error while downloading chart:', error);
    }
  };

  const transformComparisonData = (salesData) => {
    const comparisonData = [];
  
    // Get all unique categories (e.g., regions) from the sales data
    const categories = Array.from(new Set(
      Object.values(salesData).reduce((acc, item) => [...acc, ...Object.keys(item)], [])
    ));
   
    // For each category, build a data object for comparison
    categories.forEach((category) => {
      const rowData = { category }; 
  
      // Iterate over the main keys (e.g., products/widgets)
      Object.keys(salesData).forEach((mainKey) => {
        rowData[`${mainKey}_count`] = salesData[mainKey][category] || 0; // Safely access data
      });
  
      comparisonData.push(rowData);
    });
  
    console.log(comparisonData);
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
                <Cell key={`cell-${index}`} fill={getDynamicColor(index)}/>
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
  <BarChart
    width={350}
    height={300}
    data={compareData}
    margin={{ top: 20, right: 20, bottom: 40, left: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis
      label={{
        value: "Count",
        angle: -90,
        position: "insideLeft",
        offset: 2,
      }}
    />
    <Tooltip />
    <Legend
      verticalAlign="top"
      height={36}
      formatter={(value) => <span style={{ color: "#333" }}>{value}</span>}
    />
    {Object.keys(compareData[0] || {})
      .filter((key) => key !== "category") // Exclude the 'category' key
      .map((key, index) => (
        <Bar
          key={index}
          dataKey={key}
          fill={getDynamicColor(index)}
          name={key.replace("_count", "")} // Use a readable name for the legend
        />
      ))}
  </BarChart>
  </div>

  {/* Line Chart for Comparison */}
  <div className="chart-item-compare">
  <LineChart
    width={350}
    height={300}
    data={compareData}
    margin={{ top: 20, right: 20, bottom: 40, left: 5 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis
      label={{
        value: "Count",
        angle: -90,
        position: "insideLeft",
        offset: 2,
      }}
    />
    <Tooltip />
    <Legend
      verticalAlign="top"
      height={36}
      formatter={(value) => <span style={{ color: "#333" }}>{value}</span>}
    />
    {Object.keys(compareData[0] || {})
      .filter((key) => key !== "category") // Exclude the 'category' key
      .map((key, index) => (
        <Line
          key={index}
          type="monotone"
          dataKey={key}
          stroke={getDynamicColor(index)}
          name={key.replace("_count", "")} // Use a readable name for the legend
        />
      ))}
  </LineChart>
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


      <div id="screenshotofsingle" className="chart-container">{renderCharts()}</div>
      {data && <button className="download-button screenshotofsingle" onClick={(e)=>{ downloadChart(e)}}>Download Chart</button>}

      <div className="column-selection-compare" >
        <div>
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
        </div>
        <div>
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
        </div>
        <div>
        <label htmlFor="metric">Provide metric for comparison:</label>
        <select
          id="metric"
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
        >
          <option value="">Select metric</option>
          {columns.map((column, index) => (
            <option key={index} value={column}>
              {column}
            </option>
          ))}
        </select>
        </div>
        <button onClick={handleCompareChange}>Compare Columns</button>
      </div>
      <div id="screenshotofcompare" className="chart-container">{renderComparisonCharts()}</div>
      {compareData && <button className="download-button screenshotofcompare" onClick={(e)=>{ downloadChart(e)}}>Download Chart</button>}


    </div>
  );
};

export default App;

import React, { useState } from 'react';
import './App.css';

function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [outputData, setOutputData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  // Handle file submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      alert('Please upload a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('csvFile', csvFile);

    try {
      // Send file to backend
      const response = await fetch('http://localhost:5000/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        fetchOutputFile();
      } else {
        throw new Error(result.error || 'An error occurred');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch processed file from backend
  const fetchOutputFile = async () => {
    try {
      const response = await fetch('http://localhost:5000/output');
      const text = await response.text();
      parseCsvToTable(text);
    } catch (err) {
      setError('Failed to fetch the output file.');
    }
  };

  // Parse CSV data into table format
  const parseCsvToTable = (csvText) => {
    const rows = csvText.split('\n').map((row) => row.split(','));
    setOutputData(rows);
  };

  return (
    <div className="App">
      <h1>Flower Exchange Application</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Process CSV'}
        </button>
      </form>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {outputData && (
        <table>
          <thead>
            <tr>
              {outputData[0].map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outputData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;

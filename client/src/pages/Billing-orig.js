import React, { useState } from 'react';
import { Button, MenuItem, Select, FormControl, InputLabel, Container, Typography } from '@mui/material';
import axios from 'axios';
import { saveAs } from 'file-saver';

import CircularProgress from '@mui/material/CircularProgress';

const ButtonDesigns = () => {
    const [loading, setLoading] = useState(false);
//   const [buttonStyle, setButtonStyle] = useState('contained');
  const [selectValueType, setSelectValueType] = useState('unbilled');
  const [selectValueEstimate, setSelectValueEstimate] = useState('usage');
  const [selectValuePeriod, setSelectValuePeriod] = useState('current');

  const  jsonToCsv = (jsonData) => {
    console.log(jsonData)
    // Get the keys (headers) from the first object in the JSON data
    const headers = Object.keys(jsonData[0]);

    // Create the CSV rows starting with the header row
    const rows = [
        headers.join(','), // Join headers with commas
        ...jsonData.map(row => headers.map(header => row[header]).join(','))
    ];

    // Join all rows with newlines
    return rows.join('\n');
}
  const downloadCSV = async () => {
    setLoading(true)
    const data = await getData()
    
    const csvData = jsonToCsv(data);

// Convert CSV string to Blob and trigger file download using saveAs
    const blob = new Blob([csvData], { type: 'text/csv' });
    saveAs(blob, 'data.csv');
    setLoading(false)
  };
//   http://localhost:4005/api/unbilled
  const handleSelectChangeType = (event) => {
    setSelectValueType(event.target.value);
    // setButtonStyle(event.target.value);
  };
  const handleSelectChangeEstimate = (event) => {
    setSelectValueEstimate(event.target.value);
    // setButtonStyle(event.target.value);
  };
  const handleSelectChangePeriod = (event) => {
    setSelectValuePeriod(event.target.value);
    // setButtonStyle(event.target.value);
  };
  

   const getData = async () => {
        try {
          const res = await axios({
            method: 'POST',
            url: `${process.env.REACT_APP_API_URL}/api/unbilled`,
            data: {
                period : selectValuePeriod
                
            },
            withCredentials: true,
          });
    
        //   navigate(res.data.redirect);

        // console.log(res)
          return res.data.data.items;
        } catch (err) {
          console.log(err);
        }
        // setUser(null);
        // navigate('/'); 
      };


  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        API BILLING
      </Typography>
      
      <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
        <InputLabel id="button-style-select-label">Type of Billing</InputLabel>
        <Select
          labelId="button-style-select-label"
          value={selectValueType}
          onChange={handleSelectChangeType}
          label="Select Button Style"
        >
          <MenuItem value="billed">Billed</MenuItem>
          <MenuItem value="unbilled">Unbilled</MenuItem>
          
        </Select>
      </FormControl>
      <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
        <InputLabel id="button-style-select-label">Estimates</InputLabel>
        <Select
          labelId="button-style-select-label"
          value={selectValueEstimate}
          onChange={handleSelectChangeEstimate}
          label="Select Button Style"
        >
          <MenuItem value="usage">Daily Usage</MenuItem>
          <MenuItem value="recon">Invoice Recon</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
        <InputLabel id="button-style-select-label">Period</InputLabel>
        <Select
          labelId="button-style-select-label"
          value={selectValuePeriod}
          onChange={handleSelectChangePeriod}
          label="Select Button Style"
        >
          <MenuItem value="current">Current</MenuItem>
          <MenuItem value="last">Last</MenuItem>
        </Select>
      </FormControl>

      <div>
      <Button 
        variant="contained" 
        onClick={downloadCSV} 
        disabled={loading} // Disable button while loading
        startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null} // Show spinner as startIcon
      >
        {loading ? 'Loading...' : 'Download'}
      </Button>
      </div>
    </Container>
  );
};

export default ButtonDesigns;

import React, { useState, useEffect } from 'react'; // Import useEffect along with useState
import { Button, MenuItem, Select, FormControl, InputLabel, Container, Typography } from '@mui/material';
import axios from 'axios';
import { saveAs } from 'file-saver';
import CircularProgress from '@mui/material/CircularProgress';

const ButtonDesigns = () => {
  const [loading, setLoading] = useState(false);
  const [selectInvoiceId, setSelectInvoiceId] = useState('none');
  const [selectValueType, setSelectValueType] = useState('unbilled');
  const [selectValueEstimate, setSelectValueEstimate] = useState('usage');
  const [selectValuePeriod, setSelectValuePeriod] = useState('current');
  const [invoiceIds, setInvoiceIds] = useState([]); // State for invoice IDs

  // Fetch invoice IDs when "Billed" is selected
  const fetchInvoiceIds = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/invoiceIds`, {}, { withCredentials: true });
      console.log("Fetched Invoice IDs from backend:", res.data.invoiceIds); // Debugging log
      setInvoiceIds(res.data.invoiceIds || []); // Update the state
    } catch (err) {
      console.error("Error fetching invoice IDs:", err);
    }
  };

  const handleSelectChangeType = (event) => {
    setSelectValueType(event.target.value);
    if (event.target.value === "billed") {
      fetchInvoiceIds(); // Fetch invoice IDs when "Billed" is selected
    } else {
      setInvoiceIds([]); // Clear invoice IDs for other types
    }
  };

  const handleSelectChangeInvoiceID = (event) => {
    setSelectInvoiceId(event.target.value);
  };

  const handleSelectChangeEstimate = (event) => {
    setSelectValueEstimate(event.target.value);
  };

  const handleSelectChangePeriod = (event) => {
    setSelectValuePeriod(event.target.value);
  };

  const jsonToCsv = (jsonData) => {
    console.log(jsonData);
    const headers = Object.keys(jsonData[0]);
    const rows = [
      headers.join(','), // Join headers with commas
      ...jsonData.map(row => headers.map(header => row[header]).join(',')),
    ];
    return rows.join('\n');
  };

  // const downloadCSV = async () => {
  //   if (selectInvoiceId === 'none') {
  //     alert("Please select an Invoice ID before downloading.");
  //     return;
  //   }
  const downloadCSV = async () => {
    setLoading(true)
    const data = await getData()
      
    const csvData = jsonToCsv(data);

    // Convert CSV string to Blob and trigger file download using saveAs
    const blob = new Blob([csvData], { type: 'text/csv' });
    saveAs(blob, 'data.csv');
    setLoading(false)
  };

  //   // setLoading(true);
  //   try {
  //     const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/billed`, { invoiceId: selectInvoiceId }, { withCredentials: true });
  //     console.log("Downloaded Data:", res.data);

  //     const csvData = jsonToCsv(res.data.data.items); // Convert the data to CSV
  //     const blob = new Blob([csvData], { type: 'text/csv' });
  //     saveAs(blob, 'data.csv'); // Trigger file download
  //   } catch (err) {
  //     console.error("Error downloading data:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // Fetch data based on the selected type (Billed or Unbilled)
  const getData = async () => {
    try {
      const endpoint = selectValueType === 'billed' ? '/api/billed' : '/api/unbilled';
      const requestData = selectValueType === 'billed'
        ? { invoiceId: selectInvoiceId } // For "Billed", send the selected Invoice ID
        : { period: selectValuePeriod }; // For "Unbilled", send the selected period

      const res = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, requestData, { withCredentials: true });
      console.log("Fetched Data:", res.data);
      return res.data.data.items; // Return the fetched data
    } catch (err) {
      console.error("Error fetching data:", err);
      throw err;
    }
  };
  // const getData = async () => {
  //   try {
  //     const res = await axios({
  //       method: 'POST',
  //       url: `${process.env.REACT_APP_API_URL}/api/unbilled`,
  //       data: {
  //           period : selectValuePeriod
            
  //       },
  //       withCredentials: true,
  //     });

  //   //   navigate(res.data.redirect);

  //   // console.log(res)
  //     return res.data.data.items;
  //   } catch (err) {
  //     console.log(err);
  //   }
  //   // setUser(null);
  //   // navigate('/'); 
  // };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        API BILLING
      </Typography>
      <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
        <InputLabel id="billing-type-select-label">Type of Billing</InputLabel>
        <Select
          labelId="billing-type-select-label"
          value={selectValueType}
          onChange={handleSelectChangeType}
          label="Type of Billing"
        >
          <MenuItem value="billed">Billed</MenuItem>
          <MenuItem value="unbilled">Unbilled</MenuItem>
        </Select>
      </FormControl>
      {selectValueType === "billed" && (
        <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
          <InputLabel id="invoice-id-select-label">Select Invoice ID</InputLabel>
          <Select
            labelId="invoice-id-select-label"
            value={selectInvoiceId}
            onChange={handleSelectChangeInvoiceID}
            label="Select Invoice ID"
          >
            <MenuItem value="none">None</MenuItem>
            {invoiceIds.map((id) => (
              <MenuItem key={id} value={id}>
                {id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
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
          disabled={loading || selectInvoiceId === 'none'} // Disable button if no Invoice ID is selected
          startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null} // Show spinner as startIcon
        >
          {loading ? 'Loading...' : 'Download'}
        </Button>
      </div>
    </Container>
  );
};

export default ButtonDesigns;
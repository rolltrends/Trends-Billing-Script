import React, { useState } from 'react'; // Import useEffect along with useState
import { Button, MenuItem, Select, FormControl, InputLabel, Container, Typography } from '@mui/material';
import axios from 'axios';
import { saveAs } from 'file-saver';
import CircularProgress from '@mui/material/CircularProgress';

const ButtonDesigns = () => {
  const [loading, setLoading] = useState(false);
  const [loadingInvoiceIds, setLoadingInvoiceIds] = useState(false); // State to track loading of Invoice IDs
  const [selectInvoiceId, setSelectInvoiceId] = useState('none');
  const [selectValueType, setSelectValueType] = useState('unbilled');
  const [selectValueEstimate, setSelectValueEstimate] = useState('usage');
  const [selectValuePeriod, setSelectValuePeriod] = useState('current');
  const [invoiceIds, setInvoiceIds] = useState([]); // State for invoice IDs

  // Fetch invoice IDs when "Billed" is selected
  const fetchInvoiceIds = async () => {
    setLoadingInvoiceIds(true); // Start loading
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/invoiceIds`, {}, { withCredentials: true });
      console.log("Fetched Invoice IDs from backend:", res.data.invoiceIds); // Debugging log
      setInvoiceIds(res.data.invoiceIds || []); // Update the state
    } catch (err) {
      console.error("Error fetching invoice IDs:", err);
    } finally {
      setLoadingInvoiceIds(false); // Stop loading
    }
  };

  const handleSelectChangeType = (event) => {
    setSelectValueType(event.target.value);
    if (event.target.value === "billed") {
      fetchInvoiceIds(); // Fetch invoice IDs when "Billed" is selected
    } else {
      setInvoiceIds([]); // Clear invoice IDs for other types
      setSelectInvoiceId('none'); // Reset selected Invoice ID
    }
  };

  const handleSelectChangeInvoiceID = (event) => {
    if (!event || !event.target) {
      console.error("Invalid event object:", event); // Debugging log
      return;
    }
    setSelectInvoiceId(event.target.value); // Update the state
    console.log("Selected Invoice ID:", event.target.value); // Debugging log
  };

  const handleSelectChangeEstimate = (event) => {
    setSelectValueEstimate(event.target.value);
    console.log("Selected Estimate:", event.target.value); // Debugging log
  };

  const handleSelectChangePeriod = (event) => {
    setSelectValuePeriod(event.target.value);
  };

  const jsonToCsv = (jsonData) => {
    if (!jsonData || jsonData.length === 0) {
      console.error("Invalid JSON data for CSV conversion");
      return '';
    }
  
    const headers = Object.keys(jsonData[0]);
    const rows = [
      headers.join(','), // Join headers with commas
      ...jsonData.map(row => headers.map(header => row[header]).join(',')),
    ];
    return rows.join('\n');
  };

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const data = await getData();
      const csvData = jsonToCsv(data);
  
      // Convert CSV string to Blob and trigger file download using saveAs
      const blob = new Blob([csvData], { type: 'text/csv' });
      saveAs(blob, 'data.csv');
    } catch (err) {
      console.error("Error downloading data:", err);
      alert("Failed to download data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getData = async () => {
    try {
      const endpoint = selectValueType === 'billed' ? '/api/billed' : '/api/unbilled';
      const requestData = selectValueType === 'billed'
        ? { invoiceId: selectInvoiceId } // For "Billed", send the selected Invoice ID
        : { period: selectValuePeriod }; // For "Unbilled", send the selected period
  
      console.log("Request Data:", requestData); // Debugging log
      const res = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, requestData, { withCredentials: true });
      console.log("Fetched Data:", res.data);
      return res.data.data.items; // Return the fetched data
    } catch (err) {
      console.error("Error fetching data:", err);
      throw err;
    }
  };

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
              value={selectInvoiceId} // Bind to the state
              onChange={handleSelectChangeInvoiceID} // Update the state on change
              label="Select Invoice ID"
              disabled={loadingInvoiceIds} // Disable dropdown while loading
            >
              {console.log("Current Selected Invoice ID:", selectInvoiceId)} {/* Debugging log */}
              {loadingInvoiceIds ? (
                <MenuItem value="none" disabled>
                  Loading...
                </MenuItem>
              ) : (
                <>
                  {invoiceIds.length === 0 && <MenuItem value="none">None</MenuItem>}
                  {invoiceIds.map((id) => {
                    console.log("Rendering Invoice ID:", id); // Debugging log
                    return (
                      <MenuItem key={id} value={id}>
                        {id}
                      </MenuItem>
                    );
                  })}
                </>
              )}
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
          <MenuItem value="previous">Previous</MenuItem>
        </Select>
      </FormControl>
      <div>
        <Button
          variant="contained"
          onClick={downloadCSV}
          disabled={loading || (selectValueType === 'billed' && selectInvoiceId === 'none')} // Disable only for "Billed" if no Invoice ID is selected
          startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null} // Show spinner as startIcon
        >
          {loading ? 'Loading...' : 'Download'}
        </Button>
      </div>
    </Container>
  );
};

export default ButtonDesigns;
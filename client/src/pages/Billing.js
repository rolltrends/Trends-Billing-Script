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
      const fetchedIds = res.data.invoiceIds || [];
      setInvoiceIds(fetchedIds); // Update the state with fetched IDs
  
      // Automatically select the first invoice ID if the list is not empty
      if (fetchedIds.length > 0) {
        setSelectInvoiceId(fetchedIds[0]); // Automatically select the first invoice ID
        console.log("Auto-selected Invoice ID:", fetchedIds[0]); // Debugging log
      } else {
        setSelectInvoiceId('none'); // Reset to 'none' if no IDs are available
      }
    } catch (err) {
      console.error("Error fetching invoice IDs:", err);
    } finally {
      setLoadingInvoiceIds(false); // Stop loading
    }
  };
  
  
  const handleSelectChangeType = (event) => {
    const selectedType = event.target.value;
    setSelectValueType(selectedType);
    console.log("Selected Billing Type:", selectedType); // Debugging log
    if (selectedType === "billed") {
      fetchInvoiceIds(); // Fetch invoice IDs when "Billed" is selected
    } else {
      setInvoiceIds([]); // Clear invoice IDs for other types
      setSelectInvoiceId('none'); // Reset selected Invoice ID
      console.log("Cleared Invoice IDs and reset selected Invoice ID"); // Debugging log
    }
  };
  
  const handleSelectChangeInvoiceID = (event) => {
    const selectedId = event.target.value; // Get the selected value
    setSelectInvoiceId(selectedId); // Update the state
    console.log("Selected Invoice ID:", selectedId); // Debugging log
  };

  const handleSelectChangeEstimate = (event) => {
    setSelectValueEstimate(event.target.value);
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
      ...jsonData.map(row => headers.map(header => row[header] || '').join(',')),
    ];
    return rows.join('\n');
  };

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const data = await getData();
      console.log("Data to be converted to CSV:", data); // Debugging log
  
      if (!data || data.length === 0) {
        alert("No data available to download.");
        return;
      }
  
      const csvData = jsonToCsv(data);
      console.log("Generated CSV Data:", csvData); // Debugging log
  
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
    let endpoint = '';
    const requestData = {};

    if (selectValueType === 'billed') {
      if (selectValueEstimate === 'usage') {
        endpoint = '/api/billed-usage-line-items';
        requestData.invoiceId = selectInvoiceId; // For "Billed Usage", send the selected Invoice ID
      } else if (selectValueEstimate === 'recon') {
        endpoint = '/api/billed-recon-line-items';
        requestData.invoiceId = selectInvoiceId; // For "Billed Recon", send the selected Invoice ID
      }
    } else if (selectValueType === 'unbilled') {
      if (selectValueEstimate === 'usage') {
        endpoint = '/api/unbilled-usage-line-items';
        requestData.period = selectValuePeriod; // For "Unbilled Usage", send the selected period
      } else if (selectValueEstimate === 'recon') {
        endpoint = '/api/unbilled-recon-line-items';
        requestData.period = selectValuePeriod === 'last' ? 'previous' : selectValuePeriod; // Replace "last" with "previous"
      }
    }

    console.log("Request Data:", requestData); // Debugging log
    const res = await axios.post(`${process.env.REACT_APP_API_URL}${endpoint}`, requestData, { withCredentials: true });
    console.log("Fetched Data from backend:", res.data); // Debugging log

    // Handle different data structures
    if (Array.isArray(res.data.data)) {
      return res.data.data; // Return the array directly
    } else if (res.data.data && res.data.data.items) {
      return res.data.data.items; // Extract the items array
    } else {
      alert("Unexpected data format received from the backend.");
      return [];
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    throw err;
  }
};

  return (
    <Container>
      <Typography variant="h5" align='center' gutterBottom>
       TRENDS & TECHNOLOGIES, INC
      </Typography>
      <Typography variant="h6" align='center' gutterBottom>
       MPN Billing
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
        <>
          {/* Debugging log */}
          {console.log("Rendering Invoice IDs:", invoiceIds)} {/* Debugging log */}
            <FormControl fullWidth variant="outlined" style={{ marginBottom: '20px' }}>
              <InputLabel id="invoice-id-select-label">Select Invoice ID</InputLabel>
              <Select
                labelId="invoice-id-select-label"
                value={selectInvoiceId} // Bind to the state
                onChange={handleSelectChangeInvoiceID} // Update the state on change
                label="Select Invoice ID"
                disabled={loadingInvoiceIds} // Disable dropdown while loading
              >
                {loadingInvoiceIds ? (
                  <MenuItem value="none" disabled>
                    Loading...
                  </MenuItem>
                ) : (
                  [
                    !invoiceIds.length && <MenuItem key="none" value="none">None</MenuItem>,
                    ...invoiceIds.map((id) => (
                      <MenuItem key={id} value={id}>
                        {id}
                      </MenuItem>
                    )),
                  ]
                )}
              </Select>
            </FormControl>
        </>
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
        <MenuItem value="last">Last</MenuItem>
        <MenuItem value="current">Current</MenuItem>
        {/* <MenuItem value="previous">Previous</MenuItem> */}
      </Select>
      </FormControl>
      <div>
        <Button
          variant="contained"
          onClick={downloadCSV}
          style={{ backgroundColor: 'darkgreen', color: 'white' }} // Change button color to dark green
          startIcon={loading ? <CircularProgress size={24} style={{ color: 'white' }} /> : null} // Show spinner as startIcon
        >
          {loading ? 'Loading...' : 'Download'}
        </Button>
      </div>
    </Container>
  );
};
export default ButtonDesigns;
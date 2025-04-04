import React, { useEffect, useState } from 'react';
import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper, TextField, TablePagination, Grid, Tab, Tabs } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

const Reports = () => {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState({ sender: '', number: '', message: '', timestamp: '' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeTab, setActiveTab] = useState(0);  // State for tracking the active tab
  const [filteredSMSData, setFilteredSMSData] = useState([]);  // Store filtered SMS data

  // Function to fetch data from the API
  const fetchData = async () => {
    try {
      if (activeTab === 0) {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sms`);
        setData(response.data.sms);
      } else {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/chats`);
        setData(response.data.chats);
      }
    } catch (error) {
      console.error("Error fetching data: ", error);
    }
  };

  // Effect to fetch data when the component mounts or when the activeTab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSearchChange = (e, column) => {
    setSearch({ ...search, [column]: e.target.value });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter data based on active tab, search fields, and date range
  const getFilteredData = () => {
    if (!data || data.length === 0) return [];

    console.log(data)
   

    let matchesNumber = ''
    let matchesMessage = ''
    return data.filter(row => {
      const matchesSender = row.sender.toLowerCase().includes(search.sender.toLowerCase()) || search.sender === '';
      if(activeTab === 0){
         matchesNumber = row.number.toString().includes(search.number) || search.number === '';
         matchesMessage = row.message.toLowerCase().includes(search.message.toLowerCase()) || search.message === '';
      
      }
      const matchesStartDate = !startDate || new Date(row.timestamp) >= startDate;
      const matchesEndDate = !endDate || new Date(row.timestamp) <= endDate;

      if(activeTab === 0){
        return matchesSender && matchesNumber && matchesMessage && matchesStartDate && matchesEndDate;
    
      }
      return matchesSender  && matchesStartDate && matchesEndDate;
    });
  };

  // Store the filtered data when the SMS tab is active
  useEffect(() => {
    setFilteredSMSData(getFilteredData());
  }, [search, startDate, endDate, data]);  // Depend on data to update filtered SMS data

  const handleExport = () => {
    let headers = []
    if(activeTab === 0){
       headers = ['Sender', 'Number', 'Message', 'Date'];
    }
     headers = ['Sender', 'Text', 'Date'];
    
    let rows = []

    if(activeTab ===0){
       rows = (activeTab === 0 ? filteredSMSData : getFilteredData()).map((item) => [
        item.sender,
        item.number,
        item.message,
        new Date(item.timestamp).toLocaleDateString(),
      ]);
    }

     rows = (activeTab === 0 ? filteredSMSData : getFilteredData()).map((item) => [
      item.sender,
      item.text,
      new Date(item.timestamp).toLocaleDateString(),
    ]);
   

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.join(',') + '\n';
    });

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.target = '_blank';
    link.download = activeTab === 0 ? 'sms_report.csv' : 'chat_report.csv'; // Dynamic file name based on active tab
    link.click();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <h2>Reports</h2>
      <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
        <Tab label="SMS" />
        <Tab label="Chat" />
      </Tabs>

      {/* SMS Tab Content */}
      {activeTab === 0 && (
        <div>
          <h3>SMS Report</h3>
          <Grid container spacing={2} style={{ marginBottom: '16px' }}>
            <Grid item>Date Range: </Grid>
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newDate) => setStartDate(newDate)}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newDate) => setEndDate(newDate)}
                  renderInput={(params) => <TextField {...params} size="small" />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleExport}>
                Export to CSV
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={2} style={{ marginBottom: '16px' }}>
            <Grid item>
              <TextField
                label="Search by Sender"
                variant="outlined"
                size="small"
                value={search.sender}
                onChange={(e) => handleSearchChange(e, 'sender')}
              />
            </Grid>
            <Grid item>
              <TextField
                label="Search by Number"
                variant="outlined"
                size="small"
                value={search.number}
                onChange={(e) => handleSearchChange(e, 'number')}
              />
            </Grid>
            <Grid item>
              <TextField
                label="Search by Message"
                variant="outlined"
                size="small"
                value={search.message}
                onChange={(e) => handleSearchChange(e, 'message')}
              />
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Sender</TableCell>
                  <TableCell>Number</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSMSData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.sender}</TableCell>
                    <TableCell>{row.number}</TableCell>
                    <TableCell>{row.message}</TableCell>
                    <TableCell>{new Date(row.timestamp).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSMSData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      )}

      {/* Chat Tab Content */}
      {activeTab === 1 && (
         <div>
         <h3>CHAT Report</h3>
         <Grid container spacing={2} style={{ marginBottom: '16px' }}>
           <Grid item>Date Range: </Grid>
           <Grid item>
             <LocalizationProvider dateAdapter={AdapterDateFns}>
               <DatePicker
                 label="Start Date"
                 value={startDate}
                 onChange={(newDate) => setStartDate(newDate)}
                 renderInput={(params) => <TextField {...params} size="small" />}
               />
             </LocalizationProvider>
           </Grid>
           <Grid item>
             <LocalizationProvider dateAdapter={AdapterDateFns}>
               <DatePicker
                 label="End Date"
                 value={endDate}
                 onChange={(newDate) => setEndDate(newDate)}
                 renderInput={(params) => <TextField {...params} size="small" />}
               />
             </LocalizationProvider>
           </Grid>
           <Grid item>
             <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleExport}>
               Export to CSV
             </Button>
           </Grid>
         </Grid>

         <Grid container spacing={2} style={{ marginBottom: '16px' }}>
           <Grid item>
             <TextField
               label="Search by Sender"
               variant="outlined"
               size="small"
               value={search.sender}
               onChange={(e) => handleSearchChange(e, 'sender')}
             />
           </Grid>
           <Grid item>
             <TextField
               label="Search by Message"
               variant="outlined"
               size="small"
               value={search.text}
               onChange={(e) => handleSearchChange(e, 'message')}
             />
           </Grid>
         </Grid>

         <TableContainer component={Paper}>
           <Table>
             <TableHead>
               <TableRow>
                 <TableCell>ID</TableCell>
                 <TableCell>Sender</TableCell>
                 <TableCell>Message</TableCell>
                 <TableCell>Date</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {filteredSMSData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                 <TableRow key={row.id}>
                   <TableCell>{row.id}</TableCell>
                   <TableCell>{row.sender}</TableCell>
                   <TableCell>{row.text}</TableCell>
                   <TableCell>{new Date(row.timestamp).toLocaleDateString()}</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </TableContainer>

         <TablePagination
           rowsPerPageOptions={[5, 10, 25]}
           component="div"
           count={filteredSMSData.length}
           rowsPerPage={rowsPerPage}
           page={page}
           onPageChange={handleChangePage}
           onRowsPerPageChange={handleChangeRowsPerPage}
         />
       </div>
      )}
    </Container>
  );
};

export default Reports;

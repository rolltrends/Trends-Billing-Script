import React, { useState } from 'react';
import { Button, Input, Snackbar, Container, Box, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import * as XLSX from 'xlsx';
import axios from 'axios';
import AdminLogin from '../components/Login';
import { AuthContext } from '../components/authenContext';

const SMS = () => {
  const { setUser,user } = React.useContext(AuthContext);
  const [file, setFile] = useState(null); // Handle single file
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [data, setData] = useState([]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const binaryString = event.target.result;

      try {
        const workbook = XLSX.read(binaryString, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        let sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        sheetData = sheetData.slice(1); // Skip the header row

        const dataWithStatus = sheetData.map(row => ({
          ...row,
          status: 'Pending', // Default status
        }));

        setData(dataWithStatus);
        console.log(dataWithStatus);
        setUploading(false);
        setSuccessMessage(`${dataWithStatus.length} rows loaded successfully.`);
      } catch (err) {
        setError('Error reading the Excel file');
        setUploading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const sendSMS = async (data) => {
    setUploading(true);
    try {
      const sendPromises = data.map((row) =>
        axios.post(`${process.env.REACT_APP_API_URL}/api/send_sms`, {
          number: row[1],
          message: row[2],
          sender: user.username
        })
      );

      const res = await Promise.all(sendPromises); // Wait for all requests to finish


      // console.log() //status
      // const test = res.map((row)=> ({
      //   number: row.data.number,
      //   status: row.data.status
      // }))

      // console.log(test)
      const updatedData = data.map((row) => ({
        ...row,
        status: 'Sent',
      }));

      setData(updatedData);
      setSuccessMessage('All SMS sent successfully!');
    } catch (error) {
      console.error('Error sending SMS', error);
      setError('Failed to send SMS');
    } finally {
      setUploading(false);
    }
  };

  const column_names = (column) => {
    const columnMap = {
      '0': 'Name',
      '1': 'PhoneNumber',
      '2': 'Message',
      'status': 'Status',
    };
    return columnMap[column] || ''; // returns '' if the column isn't found
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Name', 'PhoneNumber', 'Message'], // Template header
      ['', '', ''], // Empty row for users to fill
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Create a download link for the generated file
    XLSX.writeFile(wb, 'sms_template.xlsx');
  };

  return (
    <div>
      <Container sx={{ display: 'flex', marginTop: 4 }}>
        <Box sx={{ width: '100%', borderRight: '1px solid #ddd', padding: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Upload File Button */}
            <Input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={24} /> : 'Upload File'}
            </Button>

            {/* Download Template Button */}
            <Button
              variant="contained"
              color="secondary"
              onClick={downloadTemplate}
            >
              Download Template
            </Button>
          </Box>

          <div>
            <h2>SMS to be sent:</h2>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {data.length > 0 && Object.keys(data[0]).map((key) => (
                      <TableCell key={key}>{column_names(key)}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <Button
            variant="contained"
            color="secondary"
            onClick={() => sendSMS(data)}
            disabled={uploading || data.length === 0}
            sx={{ marginTop: 2 }}
          >
            {uploading ? <CircularProgress size={24} /> : 'Send SMS'}
          </Button>

          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError('')}
            message={error}
          />
          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={() => setSuccessMessage('')}
            message={successMessage}
          />
        </Box>
      </Container>
    </div>
  );
};

export default SMS;

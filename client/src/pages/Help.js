import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Button, Box } from '@mui/material';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { pdfjs } from 'react-pdf';


// pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
pdfjs.GlobalWorkerOptions.workerSrc = `./pdf.worker.min.js`;

const OnlineHelp = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);  // state for zoom level

  useEffect(() => {
    // Simulating a file fetch or API call to get the PDF file
    const fetchPdf = async () => {
      try {
        const response = await fetch('/help.pdf');
        const blob = await response.blob();
        setPdfFile(URL.createObjectURL(blob));
        setLoading(false);
      } catch (error) {
        console.error("Error loading the PDF", error);
        setLoading(false);
      }
    };

    fetchPdf();
  }, []);

  const zoomIn = () => {
    setZoom(prevZoom => prevZoom + 0.1);
  };

  const zoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.1)); // Prevent zooming out too far
  };

  return (
    <Container sx={{ mt: 4, height: '80vh' }}>
      <Typography variant="h4" gutterBottom>
        Online Help
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : pdfFile ? (
        <div style={{ height: '100%' }}>
          <Worker workerUrl={`./pdf.worker.min.js`}>
            <Viewer fileUrl={pdfFile} scale={zoom} /> {/* Apply the zoom level here */}
          </Worker>
        </div>
      ) : (
        <Typography variant="h6" color="error">Failed to load PDF.</Typography>
      )}


    </Container>
  );
};

export default OnlineHelp;

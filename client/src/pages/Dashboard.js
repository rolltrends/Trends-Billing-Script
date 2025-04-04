import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import axios from 'axios'

// Simulated API call function (you can replace this with actual API logic)
const fetchData = async () => {
  // Simulating an API response with random count values
  // return new Promise((resolve) => {
  //   setTimeout(() => {
  //     resolve({
  //       totalUsers: Math.floor(Math.random() * 2000),
  //       activeUsers: Math.floor(Math.random() * 1500),
  //       pendingOrders: Math.floor(Math.random() * 100),
  //       messages: Math.floor(Math.random() * 200),
  //     });
  //   }, 1000); // Simulate a 1-second delay
  // });

    const counts = await axios.post(`${process.env.REACT_APP_API_URL}/api/counts`)

    return counts.data
    // return 

};

const Dashboard = () => {
  const [data, setData] = useState(null); // State to store the fetched data
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [error, setError] = useState(null); // Error state for API calls

  // Fetch data from the API
  const updateData = async () => {
    try {
      setLoading(true);
      const newData = await fetchData();
      console.log(newData)
      setData(newData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  // Fetch data initially and set up an interval to refresh every 10 seconds
  useEffect(() => {
    updateData(); // Initial data fetch
    const interval = setInterval(updateData, 10000); // Update data every 10 seconds

    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <h2>Dashboard</h2>
        <CircularProgress sx={{ display: 'block', margin: 'auto' }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <h2>Dashboard</h2>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <div>
      <Container sx={{ mt: 4 }}>
        <h2>Dashboard</h2>
        <Grid container spacing={4}>
          {data && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Total Users</Typography>
                    <Typography variant="h4" color="primary">{data.users}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Chats</Typography>
                    <Typography variant="h4" color="primary">{data.chats}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Messages</Typography>
                    <Typography variant="h4" color="primary">{data.messages}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">SMS</Typography>
                    <Typography variant="h4" color="primary">{data.sms}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Container>
    </div>
  );
};

export default Dashboard;

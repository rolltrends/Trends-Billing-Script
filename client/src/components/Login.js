import React, { useState, useContext } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../components/authenContext';
import ResponsiveAppBar from './AppBar'; // Import the AppBar component

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const login = await loginLocal({ username: username, password: password });
      if (login) {
        setUser(login.data.user);
        if (login.data.user.isFirstLogin) {
          navigate('/changepassword', { state: { isAuthenticated: true } });
        } else {
          navigate('/billing', { state: { isAuthenticated: true } });
        }
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.log(err);
    }
  };

  async function loginLocal(credentials) {
    try {
      const res = await axios({
        method: 'POST',
        url: `${process.env.REACT_APP_API_URL}/api/loginLocal`,
        withCredentials: true,
        data: credentials,
      });
      return res;
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <>
      <ResponsiveAppBar showLogout={false} /> {/* Pass showLogout as false */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/trends_logo_only.png"
          alt="Logo"
          style={{ width: '150px', marginBottom: '20px' }}
        />
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          Admin Login
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: '300px' }}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'lightgreen',
                },
                '&:hover fieldset': {
                  borderColor: 'lightgreen',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'lightgreen',
                },
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'lightgreen',
                },
                '&:hover fieldset': {
                  borderColor: 'lightgreen',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'lightgreen',
                },
              },
            }}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ marginTop: 2, backgroundColor: 'darkgreen', '&:hover': { backgroundColor: 'green' } }}
          >
            Login
          </Button>
        </form>
      </Box>
    </>
  );
};

export default AdminLogin;

import React, { useState , useContext} from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import { AuthContext } from '../components/authenContext';
const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the admin credentials from the environment variables
    try {
      const login = await loginLocal({username: username, password: password})
      if (login) {
        // onLogin();
        setUser(login.data.user)
        console.log(login.data)
        if(login.data.user.isFirstLogin){
          navigate('/changepassword',{state: {isAuthenticated: true}})
        }else{
          
        navigate('/billing',{state: {isAuthenticated: true}})
        }
      } else {
        setError('Invalid credentials. Please try again.');
      }
    }catch(err){
      console.log(err)
    }
    // Replace with real authentication logic
    
  };


  async function loginLocal(credentials) {
    // await getCSRFToken();

    try {
      const res = await axios({
        method: 'POST',
        url: `${process.env.REACT_APP_API_URL}/api/loginLocal`,
        withCredentials: true,
        data: credentials
      });

      // console.log(res)

      return res;
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <Typography variant="h5" gutterBottom>
        Admin Login
      </Typography>
      <form onSubmit={handleSubmit} style={{ width: '300px' }}>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <Button type="submit" variant="contained" fullWidth sx={{ marginTop: 2 }}>
          Login
        </Button>
      </form>
    </Box>
  );
};

export default AdminLogin;

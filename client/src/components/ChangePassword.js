import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Grid } from '@mui/material';
import { AuthContext } from './authenContext';
import axios from 'axios'
import { useNavigate, Outlet } from 'react-router-dom';
const ChangePasswordForm = () => {
    const { setUser, user } = React.useContext(AuthContext);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
const navigate = useNavigate();

  const handleSubmit = async (e) => {
    console.log(user)
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match');
      return;
    }

    if (user.password === newPassword) {
      setError('New password cannot be the same as the old password');
      return;
    }

    try {
        const login = await changepass({id: user.id,  password: newPassword})
        if (login) {
          // onLogin();
        //   setUser(login.data.user)
        //   console.log(login.data)
        //   if(login.data.user.isFirstLogin){
        //     navigate('/changepassword',{state: {isAuthenticated: true}})
        //   }else{
            
        //   navigate('/billing',{state: {isAuthenticated: true}})
        //   }
             setError('');
            alert('Password changed successfully!');
            // Clear the form
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            await handleLogout()
        } else {
          setError('Invalid credentials. Please try again.');
        }
      }catch(err){
        console.log(err)
    }


    // Handle password change logic here (e.g., API request)
    
  };

  const handleLogout = async () => {
      try {
        const res = await axios({
          method: 'POST',
          url: `${process.env.REACT_APP_API_URL}/api/logout`,
          withCredentials: true,
        });
  
        navigate(res.data.redirect);
        return res;
      } catch (err) {
        console.log(err);
      }
      setUser(null);
      navigate('/'); 
    };

   async function changepass(credentials) {
      // await getCSRFToken();
  
      try {
        const res = await axios({
          method: 'POST',
          url: `${process.env.REACT_APP_API_URL}/api/changepassword`,
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
        maxWidth: 400,
        margin: 'auto',
        padding: 3,
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Change Password
      </Typography>
      {error && (
        <Typography color="error" variant="body2" sx={{ marginBottom: 2 }}>
          {error}
        </Typography>
      )}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Old Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          sx={{ marginTop: 3 }}
        >
          Change Password
        </Button>
      </form>
    </Box>
  );
};

export default ChangePasswordForm;

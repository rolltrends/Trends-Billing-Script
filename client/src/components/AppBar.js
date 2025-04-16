import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { useNavigate, Outlet } from 'react-router-dom';
import { AuthContext } from './authenContext';
import axios from 'axios';
import { green } from '@mui/material/colors';

const pages = ['TRENDS & TECHNOLOGIES, INC.'];

function ResponsiveAppBar({ showLogout = true }) {
  const { setUser } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handlePage = (page) => {
    navigate(`/${page.toLowerCase()}`);
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

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: green[900] }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Replace "Partner Center" with the Trends logo */}
            <Box
              component="a"
              href="#"
              sx={{
                display: 'flex',
                mr: 2,
              }}
            >
              <img
                src="/Trends-logo-with-Tagline-transparent-2048x599.png" // Reference the logo in the public folder
                alt="Trends Logo"
                style={{ height: '40px', cursor: 'pointer' }}
                onClick={() => navigate('/')}
              />
            </Box>

            <Box sx={{ flexGrow: 1, display: 'flex' }}>
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePage(page)}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {page}
                </Button>
              ))}
            </Box>

            {/* Conditionally render the Logout button */}
            {showLogout && (
              <Box sx={{ flexGrow: 0 }}>
                <Button color="inherit" onClick={() => handleLogout()}>
                  Logout
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container sx={{ marginTop: 3 }}>
        <Outlet />
      </Container>
    </>
  );
}

export default ResponsiveAppBar;

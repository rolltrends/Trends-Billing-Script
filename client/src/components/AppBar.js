import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import MailIcon from '@mui/icons-material/Mail';
import { useNavigate, Outlet } from 'react-router-dom';
import { AuthContext } from './authenContext';
import axios from 'axios';
import { green, red } from '@mui/material/colors';

const pages = ['TRENDS & TECHNOLOGIES, INC.'];
const settings = ['Logout'];

function ResponsiveAppBar() {
  const { setUser, user } = React.useContext(AuthContext);
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [messageCount, setMessageCount] = React.useState(0); // Example unread messages
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handlePage = (page) => {
    if(window.innerWidth < 900){
      navigate(`/${page.target.innerText.toLowerCase()}`);
    }else{
      navigate(`/${page.toLowerCase()}`);
    }
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
      <AppBar position="static" sx={{ backgroundColor: green[500] }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              Partner Center
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{ display: { xs: 'block', md: 'none' } }}
              >
                {pages.map((page) => (
                  <MenuItem key={page} onClick={handlePage}>
                    <Typography sx={{ textAlign: 'center' }}>{page}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              TRENDS & TECHNOLOGIES, INC.
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {pages.map((page) => (
                <Button
                  key={page}
                  onClick={() => handlePage(page)}
                  sx={{ my: 2, color: 'white', display: 'block' }}
                >
                  {page === 'Messages' ? <Badge badgeContent={messageCount} color="error">
                  {page}
                </Badge>: page}
                  

                </Button>
              ))}
            </Box>
            <Box sx={{ flexGrow: 0 }}>
              <Button color="inherit" onClick={() => handleLogout()}>
                Logout
              </Button>
            </Box>
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

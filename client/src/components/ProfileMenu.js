import React from 'react';
import { Menu, MenuItem } from '@mui/material';

const ProfileMenu = ({ anchorEl, onClose, onLoginLogout }) => {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem onClick={onLoginLogout}>Logout</MenuItem>
    </Menu>
  );
};

export default ProfileMenu;

import React from 'react';
import { Badge, IconButton } from '@mui/material';
import { Notifications } from '@mui/icons-material';

const NotificationBell = ({ notifications }) => {
  return (
    <IconButton color="inherit">
      <Badge badgeContent={notifications} color="error">
        <Notifications />
      </Badge>
    </IconButton>
  );
};

export default NotificationBell;

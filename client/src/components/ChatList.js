import React from 'react';
import { List, ListItem, ListItemText, CircularProgress, Typography } from '@mui/material';

const ChatList = ({ chats, loading, onChatClick }) => {
  if (loading) {
    return <CircularProgress />;
  }

  return (
    <List>
      {chats.length === 0 ? (
        <Typography>No active chats at the moment.</Typography>
      ) : (
        chats.map((chat) => (
          <ListItem button key={chat.id} onClick={() => onChatClick(chat.id)}>
            <ListItemText primary={`Chat with ${chat.userName}`} secondary={`Last message: ${chat.lastMessage}`} />
          </ListItem>
        ))
      )}
    </List>
  );
};

export default ChatList;

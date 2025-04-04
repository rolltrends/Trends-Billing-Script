import React, { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, TextField, Button, List, ListItem, ListItemText, CircularProgress, IconButton } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import socket from '../socket';

const ChatDetailPage = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit('getChatMessages', { chatId });
    socket.on('chatMessages', (data) => {
      setMessages(data);
      setLoading(false);
    });

    return () => {
      socket.off('chatMessages');
    };
  }, [chatId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit('sendMessage', { chatId, message: newMessage });
      setNewMessage('');
    }
  };

  const handleBack = () => {
    navigate('/admin');
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton color="inherit" onClick={handleBack}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chat Detail
          </Typography>
        </Toolbar>
      </AppBar>
      <Box padding={3}>
        <Typography variant="h5">Chat with Customer</Typography>
        <List>
          {messages.map((msg, index) => (
            <ListItem key={index}>
              <ListItemText primary={msg.sender} secondary={msg.text} />
            </ListItem>
          ))}
        </List>
        <TextField
          label="Type a message"
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          variant="outlined"
          multiline
          rows={4}
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatDetailPage;

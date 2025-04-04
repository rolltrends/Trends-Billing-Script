import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

const ChatBox = ({ chatID, username, socket, setMessages, messages, isAdmin }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // Determine sender and receiver based on user type
    const sender = isAdmin ? 'Admin' : username;
    const receiver = isAdmin ? username : 'Admin';

    // Emit the message with proper sender/receiver

    // console.log('asdasd',{ chatID, message, sender, receiver })
    socket.emit('sendMessage', { chatID, message, sender, receiver });
    setMessages((prev) => [...prev, { sender, text: message }]);
    setMessage('');
  };

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (msg.chatID === chatID) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => socket.off('receiveMessage', handleReceiveMessage);
  }, [chatID, socket, setMessages]);

  return (
    <Box>
      <Paper elevation={3} sx={{ padding: 2, height: '400px', overflowY: 'scroll' }}>
        <Typography variant="h6">Chat with {username || 'Unknown'}</Typography>
        {messages.map((msg, index) => (
          <p key={index} style={{
            color: msg.sender === "Admin" ? "purple" : "black", // Different colors for Admin and User messages
          }}>
            {msg.sender === "You" ? "You" : msg.sender}: {msg.text}
          </p>
        ))}
      </Paper>
      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <TextField
          label="Type a message"
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
        />
        <Button onClick={handleSendMessage} variant="contained" color="primary">
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatBox;

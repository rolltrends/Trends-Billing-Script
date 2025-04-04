import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

const CustomerChat = () => {
  const [socket, setSocket] = useState(null);
  const [chatID, setChatID] = useState(null);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // Create a ref to the message container
  const messageEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    return () => newSocket.close(); // Cleanup on unmount
  }, []);

  const handleStartChat = () => {
    if (!username.trim()) return;

    socket.emit('createChat', { username });
    socket.on('chatID', ({ chatID }) => setChatID(chatID));
    socket.on('chatHistory', (history) => setMessages(history));
  };

  const handleOnKeyDown = (event) => {
    if (event.key === 'Enter') {
      if (!message.trim()) return;

      socket.emit('sendMessage', { chatID, message, sender: username, receiver: 'Admin' });

      setMessages((prev) => [...prev, { sender: username, text: message }]);
      setMessage('');
    }
  };

  // Send message from customer to admin
  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Send message with the sender as "You"
    socket.emit('sendMessage', { chatID, message, sender: username, receiver: 'Admin' });

    // Update local state to reflect the new message
    setMessages((prev) => [...prev, { sender: username, text: message }]);

    setMessage(''); // Clear message input after sending
  };

  // Receive message (either from admin or another source)
  useEffect(() => {
    if (!socket || !chatID) return;

    socket.on('receiveMessage', (msg) => {
      if (msg.chatID === chatID) {
        const sound = new Audio('/sounds/caap-notif.mp3'); // Path to the sound file
        sound.play();
        setMessages((prev) => [...prev, msg]);
      }
    });
  }, [chatID, socket]);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      {!chatID ? (
        <Box>
          <Typography variant="h5" gutterBottom>
            Start a New Chat
          </Typography>
          <TextField
            label="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            variant="outlined"
          />
          <Button
            onClick={handleStartChat}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Start Chat
          </Button>
        </Box>
      ) : (
        <Box>
          <Paper
            elevation={3}
            sx={{
              padding: 2,
              height: '400px',
              overflowY: 'auto',
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Chat with Admin
            </Typography>
            {messages.map((msg, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography
                  variant="body2"
                  color={msg.sender === username ? 'primary' : 'secondary'}
                >
                  <strong>{msg.sender}: </strong>
                  {msg.text}
                </Typography>
              </Box>
            ))}
            {/* Add a ref to scroll to the bottom */}
            <div ref={messageEndRef} />
          </Paper>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Type a message"
              variant="outlined"
              value={message}
              onKeyDown={handleOnKeyDown}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
            >
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomerChat;

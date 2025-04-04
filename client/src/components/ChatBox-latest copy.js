import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

const ChatBox = ({ chatID, username, socket, setMessages, messages, isAdmin }) => {
  const [currentUser, setCurrentUser] = useState(isAdmin ? 'You' : 'Agent')
  const [message, setMessage] = useState('');
  const messageEndRef = useRef(null);

  const handleOnKeyDown = (event) => {
    if(event.key === 'Enter'){
      if (message.trim() === '') return;

      // Define the sender and receiver based on whether it's Admin or Customer
  
      const sender = isAdmin ? 'Admin' : 'Agent'; // Admin sees their own messages as 'You', Customer sees their own messages as 'You'
      const receiver = isAdmin ? username || 'Customer' : 'Admin'; // Admin sees Customer's name, Customer sees 'Admin'
  
      // Emit message with chatID, sender, message, and receiver
      // console.log('sendMessage', { chatID, message, sender, receiver })
      socket.emit('sendMessage', { chatID, message, sender, receiver });
  
      // If Admin, append message with 'You' for Admin, otherwise append message with 'You' for Customer
      setMessages((prev) => [
        ...prev,
        { sender, text: message }
      ]);
  
      setMessage(''); // Clear the input field after sending
    }
   
  }
  // Send a message from either Admin or Customer
  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // Define the sender and receiver based on whether it's Admin or Customer

    const sender = isAdmin ? 'Admin' : 'Agent'; // Admin sees their own messages as 'You', Customer sees their own messages as 'You'
    const receiver = isAdmin ? username || 'Customer' : 'Admin'; // Admin sees Customer's name, Customer sees 'Admin'

    // Emit message with chatID, sender, message, and receiver
    // console.log('sendMessage', { chatID, message, sender, receiver })
    socket.emit('sendMessage', { chatID, message, sender, receiver });

    // If Admin, append message with 'You' for Admin, otherwise append message with 'You' for Customer
    setMessages((prev) => [
      ...prev,
      { sender, text: message }
    ]);

    setMessage(''); // Clear the input field after sending
  };

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {

    const handle = (msg) => {
      console.log(msg)
      if (msg.chatID === chatID) {
        setMessages(messages)
        // console.log(msg)
        // Avoid adding duplicate messages based on message text and sender
        const isDuplicate = messages.some((m) => m.text === msg.text && m.sender === msg.sender);
        console.log()
        
        // if (!isDuplicate) {
        //   // If Admin is receiving message, show Customer's name, otherwise show the Admin's name for Customer
        //   if (msg.sender !== 'Admin' && isAdmin) {
        //     setMessages((prev) => [...prev, { sender: msg.sender || 'Customer', text: msg.text }]);
        //   } else {
            // setMessages((prev) => [...prev, msg]); // Add message for Admin's view or Customer's view
        //   }
        // }
      }
    };

    socket.on('receiveMessage', handle);

    // return () => {
    //   socket.off('', handle);
    // };
  }, [messages]);

  return (
    <Box>
      <Paper elevation={3} sx={{ padding: 2, height: '400px', overflowY: 'scroll' }}>
        <Typography variant="h6">Chat with {username || 'Unknown'}</Typography>
        {messages.map((msg, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography
              variant="body2"
              color={msg.sender === 'You' ? 'primary' : msg.sender.toLowerCase() === 'admin' ? 'primary' : 'purple'}
            >
              <strong>{msg.sender}: </strong>
              {msg.text}
            </Typography>
          </Box>
        ))}
        <div ref={messageEndRef} />
      </Paper>
      <TextField
        label="Type a message"
        variant="outlined"
        value={message}
        onKeyDown={handleOnKeyDown}
        onChange={(e) => setMessage(e.target.value)}
        fullWidth
      />
      <Button onClick={handleSendMessage} variant="contained" color="primary">
        Send
      </Button>
    </Box>
  );
};

export default ChatBox;

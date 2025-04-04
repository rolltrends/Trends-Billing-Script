import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AppBar, Container, Toolbar, Typography, Box, List, ListItem, ListItemText, Button } from '@mui/material';
import ChatBox from '../components/ChatBox';
import AdminLogin from '../components/AdminLogin';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeChats, setActiveChats] = useState([]);
  const [inactiveChats, setInactiveChats] = useState([]);
  const [selectedChatID, setSelectedChatID] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    newSocket.emit('registerAdmin');
    newSocket.on('activeChats', setActiveChats);
    newSocket.on('inactiveChats', setInactiveChats);

    // Listen for incoming messages (from customer or admin)
    newSocket.on('receiveMessage', ({ sender, text, chatID }) => {
      if (selectedChatID === chatID) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender, text },
        ]);
      }
    });

    return () => newSocket.close();
  }, [isAuthenticated, selectedChatID]);

  useEffect(() => {
    if (!socket || !selectedChatID) return;

    socket.emit('selectChat', { chatID: selectedChatID });
    socket.on('chatHistory', ({ history }) => setMessages(history));

    return () => socket.off('chatHistory');
  }, [socket, selectedChatID]);

  const handleChatSelect = (chatID) => {
    setSelectedChatID(chatID);
    setMessages([]);
    const selectedChat = activeChats.find((chat) => chat.chatID === chatID);
    setCurrentUsername(selectedChat?.username || 'Unknown');
  };

  const handleSendMessage = (message) => {
    if (!message || !selectedChatID || !socket) return;

    const sender = 'Admin'; // Admin sends message
    socket.emit('sendMessage', {
      chatID: selectedChatID,
      message,
      sender,
    });

    // Add the message to the local messages state immediately for real-time UI update
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'Admin', text: message },
    ]);
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={() => setIsAuthenticated(false)}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between">
          <Box sx={{ width: '300px' }}>
            <Typography variant="h6">Active Chats</Typography>
            <List>
              {activeChats.map((chat) => (
                <ListItem button key={chat.chatID} onClick={() => handleChatSelect(chat.chatID)}>
                  <ListItemText primary={chat.username} />
                </ListItem>
              ))}
            </List>

            <Typography variant="h6" sx={{ mt: 4 }}>
              Inactive Chats
            </Typography>
            <List>
              {inactiveChats.map((chat) => (
                <ListItem key={chat.chatID}>
                  <ListItemText primary={chat.username} />
                </ListItem>
              ))}
            </List>
          </Box>

          {selectedChatID && (
            <Box sx={{ flex: 1, ml: 4 }}>
              <ChatBox
                chatID={selectedChatID}
                username={currentUsername}
                socket={socket}
                setMessages={setMessages}
                messages={messages}
                isAdmin={true}
              />
            </Box>
          )}
        </Box>
      </Container>
    </div>
  );
};

export default AdminDashboard;

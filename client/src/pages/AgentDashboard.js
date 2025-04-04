import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AppBar, Container, Toolbar, Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import ChatBox from '../components/ChatBox-latest';

const AgentDashboard = () => {
  const [activeChats, setActiveChats] = useState([]); // List of active chats
  const [inactiveChats, setInactiveChats] = useState([]); // List of inactive chats
  const [selectedChatID, setSelectedChatID] = useState(null); // ID of the selected chat
  const [socket, setSocket] = useState(null); // Socket.IO instance
  const [messages, setMessages] = useState([]); // Messages of the selected chat
  const [currentUsername, setCurrentUsername] = useState(''); // Username of the selected chat

  // Initialize Socket.IO connection and set up listeners
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`); // Connect to the server
    setSocket(newSocket);

    // Register as agent and set up event listeners
    newSocket.emit('registerAgent');
    newSocket.on('activeChats', setActiveChats);
    newSocket.on('inactiveChats', setInactiveChats);
    newSocket.on('newChat', (chatData) => {
      setActiveChats((prevChats) => [...prevChats, chatData]);
    });

    // Clean up listeners and connection on component unmount
    return () => {
      newSocket.close();
      newSocket.off('activeChats');
      newSocket.off('inactiveChats');
      newSocket.off('newChat');
    };
  }, []);

  // Fetch chat history when a chat is selected
  useEffect(() => {
    if (!socket || !selectedChatID) return;

    socket.emit('selectChat', { chatID: selectedChatID }); // Request chat history
    socket.on('chatHistory', ({ history }) => setMessages(history)); // Update messages state

    // Clean up listener when chat changes or component unmounts
    return () => {
      socket.off('chatHistory');
    };
  }, [socket, selectedChatID]);

  // Handle chat selection from the sidebar
  const handleChatSelect = (chatID) => {
    setSelectedChatID(chatID); // Update selected chat ID
    setMessages([]); // Clear previous messages
    const selectedChat = activeChats.find((chat) => chat.chatID === chatID);
    if (selectedChat) {
      setCurrentUsername(selectedChat.username); // Update current username
    }
  };

  return (
    <div>
      {/* Top AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Agent Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main content area */}
      <Container sx={{ display: 'flex', marginTop: 4 }}>
        {/* Sidebar for active and inactive chats */}
        <Box sx={{ width: '300px', borderRight: '1px solid #ddd', padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            Active Chats
          </Typography>
          <List>
            {activeChats.map((chat) => (
              <ListItem button key={chat.chatID} onClick={() => handleChatSelect(chat.chatID)}>
                <ListItemText primary={`Chat with ${chat.username}`} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h6" gutterBottom>
            Inactive Chats
          </Typography>
          <List>
            {inactiveChats.map((chat) => (
              <ListItem button key={chat.chatID} onClick={() => handleChatSelect(chat.chatID)}>
                <ListItemText primary={`Chat with ${chat.username} (Inactive)`} />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Chat content */}
        <Box sx={{ flexGrow: 1, padding: 2 }}>
          {selectedChatID ? (
            <ChatBox
              chatID={selectedChatID}
              username={currentUsername}
              socket={socket}
              setMessages={setMessages}
              messages={messages}
              isAgent={true} // Agent flag for ChatBox
            />
          ) : (
            <Typography variant="body1">Select a user to start chatting.</Typography>
          )}
        </Box>
      </Container>
    </div>
  );
};

export default AgentDashboard;

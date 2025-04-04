import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Container,
  Toolbar,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import ChatBox from '../components/ChatBox-latest';
import AdminLogin from '../components/Login'; // Import the login component
import AppBar from '../components/AppBar'
import { AuthContext } from '../components/authenContext';

const AdminDashboard = () => {
  const { setUser,user } = React.useContext(AuthContext);
  // const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
  const [activeChats, setActiveChats] = useState([]); // Active chats list
  const [inactiveChats, setInactiveChats] = useState([]); // Inactive chats list
  const [selectedChatID, setSelectedChatID] = useState(null); // Selected chat ID
  const [socket, setSocket] = useState(null); // Socket connection
  const [messages, setMessages] = useState([]); // Message history
  const [currentUsername, setCurrentUsername] = useState(''); // Current customer's username
  const [unreadMessages, setUnreadMessages] = useState({});


  useEffect(() => {
    if (!user) return;
    
    // Establish socket connection
    const newSocket = io(process.env.REACT_APP_API_URL);
    setSocket(newSocket);

    newSocket.emit('registerAdmin');
    newSocket.on('activeChats', (chats) => setActiveChats(chats));
    newSocket.on('inactiveChats', (chats) => setInactiveChats(chats));
    newSocket.on('newChat', (chatData) => {
      setActiveChats((prevChats) => [...prevChats, chatData]);
    });

    return () => {
      newSocket.close();
      newSocket.off('activeChats');
      newSocket.off('inactiveChats');
      newSocket.off('newChat');
    };
  }, [user]);

  /// old
  // useEffect(()=>{
  //   if(!socket) return;
  //  const refreshChat = (msg) =>{
  //       // console.log(msg.sender)
  //       //for auto select
  //       // handleChatSelect(msg.chatID)
  //       // setSelectedChatID(msg.chatID)
  //       setMessages((prev) => [...prev, msg])
  //     }

  //   socket.on('receiveMessage',refreshChat)
  // },[socket,messages,selectedChatID])

  useEffect(() => {
    if (!socket) return;
  
    const refreshChat = (msg) => {
      setMessages((prev) => [...prev, msg]);
  
      // Play sound when a new message arrives
      const sound = new Audio('/sounds/caap-notif.mp3'); // Path to the sound file
      sound.play();


      // Update unread messages for the relevant chat
      setUnreadMessages((prevUnreadMessages) => {
        const newUnreadMessages = { ...prevUnreadMessages };
        if (msg.chatID !== selectedChatID) {
          // If the chat is not selected, increment the unread message count
          newUnreadMessages[msg.chatID] = (newUnreadMessages[msg.chatID] || 0) + 1;
        }
        // console.log(newUnreadMessages)
        return newUnreadMessages;
      });
    };
  
    socket.on('receiveMessage', refreshChat);
  
    return () => {
      socket.off('receiveMessage', refreshChat);
    };
  }, [socket, messages, selectedChatID]);
  

  useEffect(() => {
    if (!socket || !selectedChatID) return;


    // console.log()
    

    socket.emit('selectChat', { chatID: selectedChatID });

    const handleChatHistory = ({ history }) => {
      console.log('test',history)
      setMessages(history);
    };

    socket.on('chatHistory', handleChatHistory);

    return () => {
      socket.off('chatHistory', handleChatHistory);
    };
  }, [socket, selectedChatID]);

  const handleChatSelect = (chatID) => {
    setSelectedChatID(chatID);
    
    // Mark as read when chat is selected
    setUnreadMessages((prevUnreadMessages) => {
      const newUnreadMessages = { ...prevUnreadMessages };
      newUnreadMessages[chatID] = 0; // Reset unread message count
      return newUnreadMessages;
    });
  
    const selectedChat = activeChats.find((chat) => chat.chatID === chatID);
    if (selectedChat) {
      setCurrentUsername(selectedChat.username);
    }
  };

  // if (!isAuthenticated) {
  //   return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  // }



  return (
    <div>
     

      <Container sx={{ display: 'flex', marginTop: 4 }}>
        <Box sx={{ width: '300px', borderRight: '1px solid #ddd', padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            Active Chats
          </Typography>
          <List>
          {activeChats.map((chat) => (
            <ListItem
              button
              key={chat.chatID}
              onClick={() => handleChatSelect(chat.chatID)}
              sx={{
                backgroundColor: selectedChatID === chat.chatID ? '#1976d2' : 'transparent',
                color: selectedChatID === chat.chatID ? '#fff' : '#000',
                border: unreadMessages[chat.chatID] > 0 ? '2px solid red' : 'none', // Add border if unread messages exist
              }}
            >
              <ListItemText
                primary={`Chat with ${chat.username}`}
                secondary={unreadMessages[chat.chatID] > 0 ? `Unread Messages: ${unreadMessages[chat.chatID]}` : ''}
              />
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

        <Box sx={{ flexGrow: 1, padding: 2 }}>
          {selectedChatID ? (
            <ChatBox
              chatID={selectedChatID}
              username={currentUsername}
              socket={socket}
              setMessages={setMessages}
              messages={messages}
              isAdmin={true} // Admin view
            />
          ) : (
            <Typography variant="body1">Select a user to start chatting.</Typography>
          )}
        </Box>
      </Container>
    </div>
  );
};

export default AdminDashboard;

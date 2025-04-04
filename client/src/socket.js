// import io from 'socket.io-client';

// const SOCKET_URL = 'http://localhost:4000'; // Backend server URL.
// const socket = io.connect(SOCKET_URL); // Initialize the Socket.IO client.

// export default socket; // Export the socket instance.

import io from 'socket.io-client';

// Load the backend server URL from an environment variable, falling back to a default value.
const SOCKET_URL = process.env.REACT_APP_API_URL; // Replace 192.168.x.x with your backend's IP
console.log(process.env.REACT_APP_API_URL)

// const socket = io.connect(SOCKET_URL, {transports: ['websocket']}); // Initialize the Socket.IO client.
const socket = io.connect(SOCKET_URL); // Initialize the Socket.IO client.

export default socket; // Export the socket instance.

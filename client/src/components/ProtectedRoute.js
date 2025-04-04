import React, { useContext } from 'react';
import { AuthContext } from './authenContext';
import { useNavigate } from 'react-router-dom'; // Or use React Router's Navigate for v6+

const ProtectedRoute = ({ children }) => {
const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // Optionally, show a loading spinner while checking auth status
  }

  if (!user) {
    return navigate('/'); // If not authenticated, redirect to the login page
  }

  return children; // Render the protected component if authenticated
};

export default ProtectedRoute;
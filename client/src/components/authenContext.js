import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios'
// Create a context for authentication
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To show loading while checking authentication status

  // Check if the user is authenticated on component mount
  useEffect(() => {

    const checkAuth = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/local`, {
        withCredentials: true, // Include cookies or session data
        });

        if (response.status === 200) {
        setUser(response.data); // Set user data if authenticated
        console.log(response.data)
        } else {
        setUser(null); // If not authenticated, set user as null
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        setUser(null); // In case of error, set user as null
    } finally {
        setLoading(false);
    }
    };


    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import AdminDashboard from './pages/Messages';
// // import ChatDetailPage from './pages/ChatDetailPage';
// import CustomerChat from './pages/CustomerChat-latest';
// import Messages from './pages/Messages';
// import SMS from './pages/SMS';
// import Reports from './pages/Reports';
// import OnlineHelp from './pages/Help'
import AdminLogin from './components/Login';
// import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import ProtectedRoute from '../src/components/ProtectedRoute';
import ResponsiveAppBar from './components/AppBar';
import ChangePasswordForm from './components/ChangePassword';
// import { AppBar } from '@mui/material';
function App() {

  return (
    <Router>
      <Routes>
      <Route index element={<AdminLogin />} />
        <Route  element={<ResponsiveAppBar />}>
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/changepassword" element={<ProtectedRoute><ChangePasswordForm /></ProtectedRoute>} />
      </Route>
      </Routes>
    </Router>
  );
}

export default App;

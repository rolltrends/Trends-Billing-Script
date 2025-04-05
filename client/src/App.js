import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/Login';
import Billing from './pages/Billing';
import ProtectedRoute from '../src/components/ProtectedRoute';
import ResponsiveAppBar from './components/AppBar';
import ChangePasswordForm from './components/ChangePassword';


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

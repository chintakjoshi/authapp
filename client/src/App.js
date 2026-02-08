import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyOtp from './pages/VerifyOtp';
import Protected from './components/Protected';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.14),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(34,197,94,0.14),transparent_36%),linear-gradient(180deg,#f8fbff_0%,#f3f7fc_55%,#eef3f9_100%)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.18),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(34,197,94,0.16),transparent_36%),linear-gradient(180deg,#07111d_0%,#0d1726_55%,#111f32_100%)]" />
      <div className="pointer-events-none fixed -left-24 top-28 -z-10 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl animate-[floatY_10s_ease-in-out_infinite]" />
      <div className="pointer-events-none fixed right-8 top-32 -z-10 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl animate-[floatX_12s_ease-in-out_infinite]" />
      <div className="ui-noise pointer-events-none fixed inset-0 -z-10 animate-[glowPulse_12s_ease-in-out_infinite]" />
      <Navbar />
      <main className="relative">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify" element={<VerifyOtp />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<Protected />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

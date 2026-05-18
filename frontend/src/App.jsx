import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import Testimonials from "./components/Testimonials";
import MedicalHistory from "./components/MedicalHistory";
import Upload from "./components/Upload";
import HelpDesk from "./components/HelpDesk";
import Footer from "./components/Footer";
import Toast from "./components/Toast";
import Register from "./components/Register";
import SignIn from "./components/SignIn";
import ProcessPage from "./components/ProcessPage";
import ProfilePage from "./components/ProfilePage";
import AuthRoute from "./components/AuthRoute";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";

function HomePage({ showToast }) {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <HowItWorks />
      <Testimonials />
      <MedicalHistory showToast={showToast} />
      <Upload showToast={showToast} />
      <HelpDesk showToast={showToast} />
      <Footer />
    </>
  );
}

function App() {
  const [toast, setToast] = useState({ visible: false, message: "" });
  const toastTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = (message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message });
    toastTimer.current = setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 3500);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate replace to="/home" />} />
          <Route path="/home" element={<HomePage showToast={showToast} />} />

          {/* Auth routes: redirect logged-in users away */}
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/signin"   element={<AuthRoute><SignIn /></AuthRoute>} />

          {/* Email verification — must be open to everyone, no redirect */}
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Password reset */}
          <Route path="/reset" element={<ResetPassword />} />

          {/* Protected */}
          <Route path="/process" element={<ProtectedRoute><ProcessPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate replace to="/home" />} />
        </Routes>
        <Toast visible={toast.visible} message={toast.message} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

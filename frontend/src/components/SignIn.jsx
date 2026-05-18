import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = location.state?.from?.pathname || "/home";

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  // Per-field errors + general error
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    // Clear the specific field error when user types
    if (name === "email") setEmailError("");
    if (name === "password") setPasswordError("");
    setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    // Client-side validation
    if (!form.email.trim()) {
      setEmailError("Email address is required.");
      return;
    }
    if (!form.password) {
      setPasswordError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || "Invalid credentials. Please try again.";
      // Try to map the backend message to a specific field
      const lower = msg.toLowerCase();
      if (lower.includes("email")) {
        setEmailError(msg);
      } else if (lower.includes("password")) {
        setPasswordError(msg);
      } else if (lower.includes("invalid email or password") || lower.includes("credentials")) {
        // Show under both fields to indicate either could be wrong
        setEmailError("Email or password is incorrect.");
        setPasswordError("Email or password is incorrect.");
      } else {
        setGeneralError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-box">
          <h1>Sign in to <br /> GallCare</h1>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: emailError ? 4 : 16 }}>
              <input
                type="email" name="email" placeholder="Email address"
                value={form.email} onChange={handleChange}
                style={emailError ? { borderColor: "#ff6b6b" } : {}}
              />
              {emailError && (
                <p style={inlineErrorStyle}>{emailError}</p>
              )}
            </div>

            {/* Password field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              <input
                type="password" name="password" placeholder="Password"
                value={form.password} onChange={handleChange}
                style={passwordError ? { borderColor: "#ff6b6b" } : {}}
              />
              {passwordError && (
                <p style={inlineErrorStyle}>{passwordError}</p>
              )}
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <Link
                to="/reset"
                style={{ color: "var(--teal, #0abfaa)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>

            <div className="checkbox-wrapper">
              <input
                type="checkbox" id="remember" name="remember"
                checked={form.remember} onChange={handleChange}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            {/* General error (network issues etc.) */}
            {generalError && <p className="form-error">{generalError}</p>}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: "0.9rem", color: "var(--muted)", textAlign: "center" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--teal, #0abfaa)", fontWeight: 600, textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-panel">
          <h2>Welcome back</h2>
          <p>Sign in to continue your gallbladder care journey with GallCare.</p>
        </div>
      </div>
    </div>
  );
}

const inlineErrorStyle = {
  color: "#d94f4f",
  fontSize: "0.82rem",
  background: "rgba(255,107,107,0.08)",
  border: "1px solid rgba(255,107,107,0.2)",
  borderRadius: 8,
  padding: "7px 12px",
  margin: 0,
  lineHeight: 1.4,
};

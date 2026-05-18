import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const from = location.state?.from?.pathname || "/home";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    updates: false,
    terms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setError("");
  };

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password)
      return "Please fill in all fields.";
    if (!form.email.includes("@"))
      return "Please enter a valid email address.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (!form.terms)
      return "You must accept the terms of use and privacy policy.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await register(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-box">
          <h1>Create your account <br /> with GallCare</h1>

          <form onSubmit={handleSubmit}>
            <button type="button" className="social-btn">
              <span className="google-icon">G</span>
              Sign in with Google
            </button>
            <div className="divider"><span>or</span></div>

            <div className="form-row">
              <input type="text" name="firstName" placeholder="First name"
                value={form.firstName} onChange={handleChange} required />
              <input type="text" name="lastName" placeholder="Last name"
                value={form.lastName} onChange={handleChange} required />
            </div>

            <input type="email" name="email" placeholder="Email address"
              value={form.email} onChange={handleChange} required />

            <input type="password" name="password" placeholder="Password (min 8 chars)"
              value={form.password} onChange={handleChange} required />

            <div className="checkbox-row">
              <div className="checkbox-wrapper">
                <input type="checkbox" id="updates" name="updates"
                  checked={form.updates} onChange={handleChange} />
                <label htmlFor="updates">I want to receive emails about product updates</label>
              </div>
              <div className="checkbox-wrapper">
                <input type="checkbox" id="terms" name="terms"
                  checked={form.terms} onChange={handleChange} required />
                <label htmlFor="terms">
                  I accept{" "}
                  <a href="/terms" className="link-underline">terms of use</a>{" "}
                  and{" "}
                  <a href="/privacy" className="link-underline">privacy policy</a>
                </label>
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create an account"}
            </button>
            <button type="button" className="auth-note" onClick={() => navigate("/signin")}>
              I already have an account
            </button>
          </form>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-panel">
          <h2>Welcome to GallCare</h2>
          <p>Register now to manage appointments, view reports, and get personalized care.</p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { medicalService } from "../services/medical.service.js";
import { useAuth } from "../context/AuthContext.jsx";

const empty = { fname: "", lname: "", dob: "", gender: "", phone: "", email: "", symptoms: "" };

export default function MedicalHistory({ showToast }) {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block unverified users
    if (!user?.isVerified) {
      setError("Please verify your email before submitting a medical record. Check your inbox for the verification link.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await medicalService.save(form);
      showToast("Medical history saved!");
      setForm(empty);
    } catch (err) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="history">
      <div className="section-head">
        <div className="section-label">Patient Records</div>
        <h2 className="section-title">Medical History</h2>
        <p className="section-sub">
          Please fill in your health information so our specialists can provide
          the most accurate and personalised care.
        </p>
      </div>

      {/* Unverified user warning banner */}
      {user && !user.isVerified && (
        <div style={{
          maxWidth: 680, margin: "0 auto 24px", padding: "14px 20px",
          background: "rgba(245,166,35,0.1)", border: "1.5px solid rgba(245,166,35,0.4)",
          borderRadius: 12, display: "flex", alignItems: "center", gap: 12,
          fontSize: "0.9rem", color: "#c47a00",
        }}>
          <span style={{ fontSize: "1.3rem" }}>⚠️</span>
          <span>
            <strong>Email not verified.</strong> Please check your inbox and verify your email to submit medical records.
          </span>
        </div>
      )}

      <form className="history-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="fname">First Name</label>
            <input id="fname" type="text" placeholder="Ahmed"
              value={form.fname} onChange={handleChange("fname")} required />
          </div>
          <div className="form-group">
            <label htmlFor="lname">Last Name</label>
            <input id="lname" type="text" placeholder="Hassan"
              value={form.lname} onChange={handleChange("lname")} required />
          </div>
          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input id="dob" type="date" value={form.dob}
              onChange={handleChange("dob")} required />
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={form.gender} onChange={handleChange("gender")}>
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Prefer not to say</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input id="phone" type="tel" placeholder="+20 010 0000 0000"
              value={form.phone} onChange={handleChange("phone")} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange("email")} required />
          </div>
          <div className="form-group full">
            <label htmlFor="symptoms">Current Symptoms</label>
            <textarea id="symptoms"
              placeholder="Describe your symptoms, when they started, and any relevant history..."
              value={form.symptoms} onChange={handleChange("symptoms")} />
          </div>

          {error && (
            <div className="form-group full">
              <p className="form-error">{error}</p>
            </div>
          )}

          <div className="form-group full" style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn-primary" style={{ width: "auto" }} disabled={loading}>
              {loading ? "Saving…" : "Save Medical History"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

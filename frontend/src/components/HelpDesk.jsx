import { useState } from "react";
import { helpdeskService } from "../services/helpdesk.service.js";

export default function HelpDesk({ showToast }) {
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await helpdeskService.send({ email, topic });
      showToast("Message sent! We will reply within 24 hours.");
      setEmail("");
      setTopic("");
    } catch (err) {
      setError(err.message || "Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="help" style={{ textAlign: "center" }}>
      <div className="section-label">Support</div>
      <h2 className="section-title">Reach our Help Desk for support</h2>
      <p className="section-sub" style={{ margin: "0 auto" }}>
        Have a question or concern? Our support team is on standby to assist you
        with bookings, billing, and clinical queries.
      </p>

      <form className="help-form" onSubmit={handleSubmit}>
        <input type="email" placeholder="Your email address"
          value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} required />
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">Topic</option>
          <option>Appointment Booking</option>
          <option>Billing & Insurance</option>
          <option>Medical Records</option>
          <option>Technical Support</option>
        </select>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Sending…" : "Contact Us"}
        </button>
      </form>

      {error && (
        <p className="form-error" style={{ marginTop: 12, color: "#ff6b6b" }}>{error}</p>
      )}
    </section>
  );
}

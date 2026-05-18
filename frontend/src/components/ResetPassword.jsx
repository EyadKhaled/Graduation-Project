import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // ── Forgot-password form state ──────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");

  // ── Reset-password form state ───────────────────────────────────────────────
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [rpLoading, setRpLoading] = useState(false);
  const [rpError, setRpError] = useState("");
  const [rpSuccess, setRpSuccess] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setFpError("Email is required."); return; }
    setFpLoading(true); setFpError("");
    try {
      const res = await fetch(`${API}/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed.");
      setSent(true);
    } catch (err) {
      setFpError(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setRpError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setRpError("Passwords do not match."); return; }
    setRpLoading(true); setRpError("");
    try {
      const res = await fetch(`${API}/auth/reset-password/?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed.");
      setRpSuccess(true);
    } catch (err) {
      setRpError(err.message);
    } finally {
      setRpLoading(false);
    }
  };

  // ── Render: if token in URL → show reset form, else → show forgot form ──────
  return (
    <div style={S.page}>
      <div style={S.left}>
        <div style={S.box}>
          <div style={S.logo}>💚 GallCare</div>

          {token ? (
            /* ── Reset Password Form ── */
            rpSuccess ? (
              <div style={S.successBox}>
                <div style={S.successIcon}>✅</div>
                <h2 style={S.successTitle}>Password reset!</h2>
                <p style={S.successText}>Your password has been changed. You can now sign in.</p>
                <button style={S.submitBtn} onClick={() => navigate("/signin")} type="button">
                  Go to Sign In
                </button>
              </div>
            ) : (
              <>
                <h1 style={S.heading}>Set new password</h1>
                <p style={S.sub}>Enter and confirm your new password below.</p>
                <form onSubmit={handleReset} style={S.form}>
                  <div style={S.fieldWrap}>
                    <input
                      type="password" placeholder="New password (min 8 chars)"
                      value={password} onChange={(e) => { setPassword(e.target.value); setRpError(""); }}
                      style={rpError ? S.inputError : S.input} required
                    />
                  </div>
                  <div style={S.fieldWrap}>
                    <input
                      type="password" placeholder="Confirm new password"
                      value={confirm} onChange={(e) => { setConfirm(e.target.value); setRpError(""); }}
                      style={rpError ? S.inputError : S.input} required
                    />
                  </div>
                  {rpError && <p style={S.errorMsg}>{rpError}</p>}
                  <button style={S.submitBtn} type="submit" disabled={rpLoading}>
                    {rpLoading ? "Resetting…" : "Reset Password"}
                  </button>
                </form>
              </>
            )
          ) : (
            /* ── Forgot Password Form ── */
            sent ? (
              <div style={S.successBox}>
                <div style={S.successIcon}>📧</div>
                <h2 style={S.successTitle}>Check your inbox</h2>
                <p style={S.successText}>
                  If <strong>{email}</strong> is registered, a reset link was sent.
                  The link expires in 1 hour.
                </p>
                <button style={S.backLink} onClick={() => navigate("/signin")} type="button">
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <>
                <h1 style={S.heading}>Forgot password?</h1>
                <p style={S.sub}>Enter your email and we'll send you a reset link.</p>
                <form onSubmit={handleForgot} style={S.form}>
                  <div style={S.fieldWrap}>
                    <input
                      type="email" placeholder="Email address"
                      value={email} onChange={(e) => { setEmail(e.target.value); setFpError(""); }}
                      style={fpError ? S.inputError : S.input} required
                    />
                    {fpError && <p style={S.inlineError}>{fpError}</p>}
                  </div>
                  <button style={S.submitBtn} type="submit" disabled={fpLoading}>
                    {fpLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
                <p style={S.bottomLink}>
                  Remember it?{" "}
                  <Link to="/signin" style={S.link}>Sign In</Link>
                </p>
              </>
            )
          )}
        </div>
      </div>

      <div style={S.right}>
        <div style={S.panel}>
          <h2>Account Recovery</h2>
          <p>We'll send a secure link to your email so you can reset your password.</p>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { display: "flex", minHeight: "100vh", fontFamily: '"DM Sans", sans-serif' },
  left: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    background: "white", padding: "40px 5%",
  },
  box: { width: "100%", maxWidth: 420 },
  logo: {
    fontSize: "1.3rem", fontFamily: '"DM Serif Display", serif',
    color: "#0d2b45", marginBottom: 32, fontWeight: 400,
  },
  heading: {
    fontFamily: '"DM Serif Display", serif', fontSize: "2rem",
    color: "#0d2b45", margin: "0 0 10px", fontWeight: 400,
  },
  sub: { color: "#5e7b8c", fontSize: "0.95rem", margin: "0 0 28px", lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 6 },
  input: {
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: "1.5px solid #e0edec", fontSize: "0.95rem",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  inputError: {
    width: "100%", padding: "13px 16px", borderRadius: 10,
    border: "1.5px solid #ff6b6b", fontSize: "0.95rem",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  },
  inlineError: {
    color: "#d94f4f", fontSize: "0.83rem",
    background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: 8, padding: "8px 12px", margin: 0,
  },
  errorMsg: {
    color: "#d94f4f", fontSize: "0.83rem",
    background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: 8, padding: "8px 12px", margin: 0,
  },
  submitBtn: {
    padding: "13px", background: "linear-gradient(135deg, #0abfaa, #089082)",
    color: "white", border: "none", borderRadius: 50,
    fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", marginTop: 4,
  },
  bottomLink: { marginTop: 20, fontSize: "0.9rem", color: "#5e7b8c", textAlign: "center" },
  link: { color: "#0abfaa", fontWeight: 600, textDecoration: "none" },
  backLink: {
    background: "transparent", border: "1px solid #e0edec", borderRadius: 50,
    padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600,
    color: "#5e7b8c", cursor: "pointer", fontFamily: "inherit",
  },
  successBox: {
    textAlign: "center", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 16, paddingTop: 12,
  },
  successIcon: { fontSize: "3rem" },
  successTitle: {
    fontFamily: '"DM Serif Display", serif', fontSize: "1.6rem",
    color: "#0d2b45", margin: 0, fontWeight: 400,
  },
  successText: { color: "#5e7b8c", fontSize: "0.95rem", lineHeight: 1.6, margin: 0, maxWidth: 320 },
  right: {
    flex: 1, background: "linear-gradient(135deg, #0d2b45 0%, #163552 60%, #0a4040 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 8%",
  },
  panel: { color: "rgba(255,255,255,0.85)", maxWidth: 380, textAlign: "center" },
};

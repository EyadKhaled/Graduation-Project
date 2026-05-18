import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSearchParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link. Please check your email.");
      return;
    }

    // Call backend to verify
    fetch(`${API}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");

          // Sync AuthContext state AND localStorage from server so isVerified is
          // immediately reflected across the whole app without a page reload.
          try {
            await refreshUser();
          } catch (_) {
            // Fallback: patch localStorage manually if refreshUser fails
            const stored = localStorage.getItem("user");
            if (stored) {
              const u = JSON.parse(stored);
              u.isVerified = true;
              localStorage.setItem("user", JSON.stringify(u));
            }
          }
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Server error. Please try again later.");
      });
  }, [token]);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>💚 GallCare</div>

        {status === "loading" && (
          <>
            <div style={S.spinner} />
            <h2 style={S.title}>Verifying your email…</h2>
            <p style={S.sub}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={S.icon}>✅</div>
            <h2 style={{ ...S.title, color: "#0abfaa" }}>Email Verified!</h2>
            <p style={S.sub}>{message}</p>
            <p style={S.sub}>You can now use all features of GallCare.</p>
            <button style={S.btn} onClick={() => navigate("/home")} type="button">
              Go to Home
            </button>
            <button style={S.btnSecondary} onClick={() => navigate("/profile")} type="button">
              View My Profile
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={S.icon}>❌</div>
            <h2 style={{ ...S.title, color: "#ff6b6b" }}>Verification Failed</h2>
            <p style={S.sub}>{message}</p>
            <p style={{ ...S.sub, fontSize: "0.82rem", color: "#9fb8c8" }}>
              The link expires after 24 hours. If it's expired, register again or contact support.
            </p>
            <button style={S.btn} onClick={() => navigate("/signin")} type="button">
              Back to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0d2b45 0%, #163552 60%, #0a4040 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: '"DM Sans", sans-serif', padding: "20px",
  },
  card: {
    background: "white", borderRadius: 20, padding: "52px 44px",
    maxWidth: 420, width: "100%", textAlign: "center",
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
  },
  logo: {
    fontSize: "1.3rem", fontFamily: '"DM Serif Display", serif',
    color: "#0d2b45", fontWeight: 400, marginBottom: 8,
  },
  icon: { fontSize: "3.5rem" },
  title: {
    fontFamily: '"DM Serif Display", serif', fontSize: "1.7rem",
    color: "#0d2b45", margin: 0, fontWeight: 400,
  },
  sub: { color: "#5e7b8c", fontSize: "0.95rem", lineHeight: 1.6, margin: 0, maxWidth: 320 },
  btn: {
    width: "100%", padding: "13px", background: "linear-gradient(135deg, #0abfaa, #089082)",
    color: "white", border: "none", borderRadius: 50, fontSize: "0.95rem",
    fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 6,
  },
  btnSecondary: {
    width: "100%", padding: "12px", background: "transparent",
    color: "#0abfaa", border: "1.5px solid #0abfaa", borderRadius: 50,
    fontSize: "0.92rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
  },
  spinner: {
    width: 44, height: 44,
    border: "4px solid #e0edec", borderTopColor: "#0abfaa",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
};

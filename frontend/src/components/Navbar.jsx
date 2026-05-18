import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <nav>
      <a className="logo" href="#">
        <div className="logo-icon">💚</div>
        GallCare
      </a>

      <ul className="nav-links">
        <li><a href="#services">Services</a></li>
        <li><a href="#how">How it Works</a></li>
        <li><a href="#testimonials">Testimonials</a></li>
        <li><a href="#history">Medical History</a></li>
        <li><a href="#help">Help Desk</a></li>
      </ul>

      {isAuthenticated ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {user?.first_name && (
            <span
              style={{
                cursor: "pointer",
                color: "var(--teal)",
                fontWeight: 600,
              }}
              onClick={() => navigate("/profile")}
            >
              {user.first_name}
            </span>
          )}

          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1.5px solid var(--border)",
              borderRadius: 50,
              padding: "8px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--navy)",
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--navy)";
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <a href="#help" className="nav-cta">
          Get Help Now
        </a>
      )}
    </nav>
  );
}
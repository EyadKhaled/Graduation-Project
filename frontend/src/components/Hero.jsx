import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  return (
    <section className="hero" id="home">
      <div className="hero-content">
        <div className="hero-badge">
          <span></span> Trusted by 10,000+ patients
        </div>

        <h1>
          Your trusted partner in <em>gallbladder</em> health
        </h1>

        <p>
          Comprehensive care and expert diagnosis for gallbladder conditions.
          Fast, compassionate, and always available when you need us most.
        </p>

        <div className="hero-actions">
          {!isAuthenticated && <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
          }
        
          {!isAuthenticated && <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
          }
        </div>
      </div>

      <div className="hero-image">
        <div className="hero-img-wrap">
          <svg
            className="doctor-svg"
            viewBox="0 0 200 260"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="62" r="38" fill="#FDDBB4" />
            <path
              d="M62 62 Q62 24 100 24 Q138 24 138 62 Q138 38 100 38 Q62 38 62 62Z"
              fill="#4A3728"
            />
            <path
              d="M55 110 Q55 100 100 100 Q145 100 145 110 L155 200 L45 200Z"
              fill="white"
            />
            <rect
              x="75"
              y="100"
              width="50"
              height="100"
              rx="4"
              fill="#0ABFAA"
              opacity="0.15"
            />
            <path
              d="M90 125 Q85 145 80 155 Q75 165 80 175"
              stroke="#0ABFAA"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="80" cy="178" r="5" fill="#0ABFAA" />
            <circle cx="88" cy="62" r="4" fill="#8B6914" />
            <circle cx="112" cy="62" r="4" fill="#8B6914" />
            <path
              d="M90 76 Q100 84 110 76"
              stroke="#C0874A"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M85 100 L100 118 L115 100"
              stroke="#ddd"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="108"
              y="130"
              width="22"
              height="28"
              rx="3"
              fill="rgba(10,191,170,0.15)"
              stroke="rgba(10,191,170,0.3)"
              strokeWidth="1"
            />
            <rect x="111" y="125" width="3" height="10" rx="1" fill="#0ABFAA" />
            <rect x="115" y="123" width="3" height="12" rx="1" fill="#F5A623" />
          </svg>
        </div>

        <div className="stat-card">
          <div className="icon icon-teal">🩺</div>
          <div>
            <div className="stat-label">Appointments</div>
            <div>2,500+ served</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="icon icon-gold">⭐</div>
          <div>
            <div className="stat-label">Rating</div>
            <div>4.9 / 5.0</div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

    if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" state={{ from: location }} replace />;
  }

  return children;
}

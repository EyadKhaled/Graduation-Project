import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { uploadService } from "../services/upload.service.js";
import { useAuth } from "../context/AuthContext.jsx";

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export default function Upload({ showToast }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [previews, setPreviews] = useState([]);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [lastUploaded, setLastUploaded] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    uploadService.getHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  const handleFiles = async (files) => {
    if (!files || uploading) return;

    // Block unverified users
    if (!user?.isVerified) {
      setError("Please verify your email before uploading images. Check your inbox for the verification link.");
      return;
    }

    const selected = Array.from(files);
    setError("");
    setUploading(true);
    setLastUploaded(null);

    try {
      const results = await Promise.all(
        selected.map(async (file) => {
          const localPreview = { url: URL.createObjectURL(file), name: file.name };
          setPreviews((prev) => [...prev, localPreview]);
          return uploadService.upload(file);
        })
      );

      setHistory((prev) => [...results, ...prev]);
      setLastUploaded(selected[selected.length - 1]);
      showToast(
        selected.length === 1
          ? "Image uploaded successfully!"
          : `${selected.length} images uploaded successfully!`
      );
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section id="upload">
      <div className="section-head">
        <div className="section-label">Diagnostics</div>
        <h2 className="section-title">Upload your scan or image</h2>
        <p className="section-sub">
          Share ultrasound images, X-rays, or any scan for remote review by our specialists.
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
            <strong>Email not verified.</strong> Please verify your email to upload images and use AI analysis.
          </span>
        </div>
      )}

      <div
        className="upload-zone"
        onClick={() => !uploading && user?.isVerified && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (user?.isVerified) e.currentTarget.classList.add("drag-over"); }}
        onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove("drag-over");
          if (user?.isVerified) handleFiles(e.dataTransfer.files);
        }}
        style={{ cursor: (uploading || !user?.isVerified) ? "not-allowed" : "pointer", opacity: (uploading || !user?.isVerified) ? 0.6 : 1 }}
      >
        <span className="upload-icon">{uploading ? "⏳" : "🖼️"}</span>
        <h3>{uploading ? "Uploading…" : "Drop your image here or click to browse"}</h3>
        <p>Supports PNG, JPG, DICOM — max 20MB per file</p>
        <button
          className="btn-outline"
          type="button"
          disabled={uploading || !user?.isVerified}
          onClick={(e) => { e.stopPropagation(); if (user?.isVerified) inputRef.current?.click(); }}
        >
          Choose File
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="form-error" style={{ textAlign: "center", marginTop: 12 }}>{error}</p>
      )}

      <div id="preview-area">
        {previews.map((preview, index) => (
          <img key={index} src={preview.url} alt={preview.name} className="preview-thumb" />
        ))}
      </div>

      {/* ── زر التحليل بالذكاء الاصطناعي ── */}
      {lastUploaded && !uploading && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
          <button
            className="btn-primary"
            type="button"
            onClick={() => navigate("/process")}
            style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "1rem" }}
          >
            🔬 Analyze with AI
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ maxWidth: 560, margin: "32px auto 0" }}>
          <p style={{
            fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--teal)", textTransform: "uppercase", marginBottom: 12,
          }}>
            Previous Uploads
          </p>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            {history.map((item, index) => (
              <div key={item.id || index} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", background: "white",
                borderTop: index !== 0 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "var(--teal-light)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>🩻</div>
                  <div>
                    <p style={{
                      fontSize: "0.9rem", fontWeight: 600, color: "var(--navy)",
                      margin: 0, maxWidth: 260, overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {item.file_name || item.name}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: 0 }}>
                      {item.file_type?.toUpperCase() || "FILE"} · {item.size ? formatSize(item.size) : "—"}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                    {item.created_at ? formatDate(item.created_at) : "—"}
                  </span>
                  {/* ── زر Analyze لكل صورة في التاريخ ── */}
                  <button
                    type="button"
                    onClick={() => navigate("/process")}
                    style={{
                      background: "var(--teal-light)",
                      color: "var(--teal-dark)",
                      border: "1px solid rgba(10,191,170,0.3)",
                      borderRadius: 50,
                      padding: "5px 14px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

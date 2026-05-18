import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const API = import.meta.env.VITE_API_BASE_URL;

// ─── Stages ───────────────────────────────────────────────────────────────────
const STAGES = {
  IDLE: "idle",
  UPLOADING: "uploading",
  ANALYZING: "analyzing",
  DONE: "done",
  ERROR: "error",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProcessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState(STAGES.IDLE);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [analysisLog, setAnalysisLog] = useState([]);
  const inputRef = useRef(null);
  const progressRef = useRef(null);

  // ── Drop / pick ──────────────────────────────────────────────────────────────
  const handleFiles = useCallback((files) => {
    if (!files?.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, DICOM).");
      return;
    }
    setError("");
    setResult(null);
    setStage(STAGES.IDLE);
    setAnalysisLog([]);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  // ── Simulate progress bar ────────────────────────────────────────────────────
  const animateProgress = (target, duration) => {
    const start = performance.now();
    const from = progress;
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setProgress(Math.round(from + (target - from) * t));
      if (t < 1) progressRef.current = requestAnimationFrame(animate);
    };
    progressRef.current = requestAnimationFrame(animate);
  };

  // ── Run analysis ─────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!imageFile) return;

    try {
      setStage(STAGES.UPLOADING);
      setProgress(0);
      setAnalysisLog([]);
      animateProgress(20, 600);

      const base64Data = await fileToBase64(imageFile);

      // ── Save image to backend uploads ────────────────────────────────────
      let uploadId = null;
      try {
        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("file_name", imageFile.name);
        formData.append("file_type", imageFile.type || "image/jpeg");
        const uploadRes = await fetch(`${API}/uploads/`, {
          method: "POST",
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadId = uploadData._id || uploadData.id || null;
        }
      } catch (_) { /* non-fatal: continue even if upload save fails */ }

      setStage(STAGES.ANALYZING);
      addLog("🔬 Preprocessing image…");
      animateProgress(40, 800);

      await sleep(600);
      addLog("🧠 Running deep tissue analysis…");
      animateProgress(65, 1200);

      // ── Call our backend — Claude API key stays server-side ──────────────
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API}/analysis/analyze/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            image_data: base64Data,
            media_type: imageFile.type || "image/jpeg",
            file_name:  imageFile.name,
            upload_id:  uploadId,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Analysis request failed.");
      }

      addLog("📊 Classifying tissue patterns…");
      animateProgress(85, 800);

      // Backend returns the parsed result object directly
      const parsed = await response.json();

      animateProgress(100, 400);
      await sleep(500);

      addLog("✅ Analysis complete.");
      setResult(parsed);
      setStage(STAGES.DONE);
    } catch (err) {
      cancelAnimationFrame(progressRef.current);
      setError(err.message || "Analysis failed. Please try again.");
      setStage(STAGES.ERROR);
    }
  };

  const addLog = (msg) =>
    setAnalysisLog((prev) => [...prev, { id: Date.now() + Math.random(), msg }]);

  const reset = () => {
    cancelAnimationFrame(progressRef.current);
    setStage(STAGES.IDLE);
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError("");
    setProgress(0);
    setAnalysisLog([]);
  };

  const isLoading =
    stage === STAGES.UPLOADING || stage === STAGES.ANALYZING;

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>💚</span>
            <span style={styles.logoText}>GallCare</span>
            <span style={styles.logoDivider}>/</span>
            <span style={styles.logoSub}>AI Analysis</span>
          </div>
          <div style={styles.badge}>
            <span style={styles.badgeDot} />
            Mansoura University
          </div>
        </div>
      </header>

      {/* ── Email verification gate ── */}
      {user && !user.isVerified && (
        <div style={{
          maxWidth: 760, margin: "24px auto 0", padding: "16px 24px",
          background: "rgba(245,166,35,0.12)", border: "1.5px solid rgba(245,166,35,0.5)",
          borderRadius: 14, display: "flex", alignItems: "center", gap: 14,
          fontSize: "0.92rem", color: "#c47a00", fontFamily: "inherit",
        }}>
          <span style={{ fontSize: "1.5rem" }}>⚠️</span>
          <div>
            <strong>Email not verified.</strong> Please check your inbox and click the verification link before running an analysis.{" "}
            <button
              type="button"
              onClick={() => navigate("/home")}
              style={{ background: "none", border: "none", color: "#0abfaa", fontWeight: 700, cursor: "pointer", textDecoration: "underline", fontFamily: "inherit" }}
            >
              Go back home
            </button>
          </div>
        </div>
      )}

      <main style={styles.main}>
        {/* ── Hero title ── */}
        <div style={styles.titleBlock}>
          <p style={styles.eyebrow}>Liver & Gallbladder Classifier</p>
          <h1 style={styles.title}>AI-Powered Diagnostic Analysis</h1>
          <p style={styles.subtitle}>
            Upload an ultrasound, CT, or MRI scan — our model classifies liver
            disease in seconds.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div style={styles.grid}>
          {/* ── Left: upload + image ── */}
          <div style={styles.leftCol}>
            <div
              style={{
                ...styles.dropzone,
                ...(imagePreview ? styles.dropzoneFilled : {}),
              }}
              onClick={() => !isLoading && inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "#0abfaa";
                e.currentTarget.style.background = "rgba(10,191,170,0.06)";
              }}
              onDragLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.background = "";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.background = "";
                handleFiles(e.dataTransfer.files);
              }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Scan preview"
                    style={styles.preview}
                  />
                  {!isLoading && (
                    <div style={styles.changeOverlay}>
                      <span>Click to change image</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.dropPlaceholder}>
                  <div style={styles.dropIcon}>🩻</div>
                  <p style={styles.dropTitle}>Drop your scan here</p>
                  <p style={styles.dropHint}>PNG, JPG, DICOM · max 20 MB</p>
                  <button style={styles.browseBtn} type="button">
                    Browse Files
                  </button>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* ── File info ── */}
            {imageFile && (
              <div style={styles.fileInfo}>
                <span style={styles.fileInfoIcon}>📄</span>
                <div>
                  <p style={styles.fileName}>{imageFile.name}</p>
                  <p style={styles.fileSize}>
                    {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {!isLoading && (
                  <button style={styles.removeBtn} onClick={reset} type="button">
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* ── CTA ── */}
            <button
              style={{
                ...styles.analyzeBtn,
                ...(isLoading || !imageFile ? styles.analyzeBtnDisabled : {}),
              }}
              onClick={handleAnalyze}
              disabled={isLoading || !imageFile}
              type="button"
            >
              {isLoading ? (
                <span style={styles.btnSpinner} />
              ) : (
                <span style={styles.btnIcon}>🔬</span>
              )}
              {isLoading ? "Analyzing…" : "Analyze Scan"}
            </button>

            {/* ── Progress bar ── */}
            {isLoading && (
              <div style={styles.progressWrap}>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progress}%`,
                    }}
                  />
                </div>
                <span style={styles.progressLabel}>{progress}%</span>
              </div>
            )}

            {/* ── Log ── */}
            {analysisLog.length > 0 && (
              <div style={styles.logBox}>
                {analysisLog.map((entry) => (
                  <p key={entry.id} style={styles.logLine}>
                    {entry.msg}
                  </p>
                ))}
              </div>
            )}

            {/* ── Error ── */}
            {error && <p style={styles.errorMsg}>⚠ {error}</p>}
          </div>

          {/* ── Right: results ── */}
          <div style={styles.rightCol}>
            {stage === STAGES.IDLE && !result && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🫀</div>
                <h3 style={styles.emptyTitle}>No scan uploaded yet</h3>
                <p style={styles.emptyText}>
                  Upload an image on the left to begin the AI-powered liver
                  disease classification.
                </p>
                <div style={styles.featureList}>
                  {[
                    ["🔍", "Tissue pattern recognition"],
                    ["📈", "Confidence scoring"],
                    ["💊", "Clinical recommendations"],
                    ["🔒", "Privacy-first processing"],
                  ].map(([icon, text]) => (
                    <div key={text} style={styles.featureItem}>
                      <span>{icon}</span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div style={styles.loadingState}>
                <div style={styles.scanAnimation}>
                  <div style={styles.scanLine} />
                  <span style={styles.scanEmoji}>🧠</span>
                </div>
                <h3 style={styles.loadingTitle}>Analyzing your scan…</h3>
                <p style={styles.loadingText}>
                  Our AI is examining tissue patterns, density variations, and
                  structural anomalies.
                </p>
              </div>
            )}

            {stage === STAGES.DONE && result && (
              <ResultCard result={result} onReset={reset} />
            )}
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <p style={styles.disclaimer}>
          ⚕ This tool is for informational purposes only and does not constitute
          medical advice. Always consult a qualified physician for diagnosis and
          treatment.
        </p>
      </main>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ result, onReset }) {
  const isHealthy = result.verdict === "Healthy";
  const isDiseased = result.verdict === "Diseased";
  const isInconclusive = result.verdict === "Inconclusive";

  const verdictColor = isHealthy
    ? "#0abfaa"
    : isDiseased
    ? "#ff6b6b"
    : "#f5a623";

  const verdictBg = isHealthy
    ? "rgba(10,191,170,0.08)"
    : isDiseased
    ? "rgba(255,107,107,0.08)"
    : "rgba(245,166,35,0.08)";

  const verdictIcon = isHealthy ? "✅" : isDiseased ? "⚠️" : "❓";

  return (
    <div style={styles.resultCard}>
      {/* ── Verdict banner ── */}
      <div style={{ ...styles.verdictBanner, background: verdictBg, borderColor: verdictColor }}>
        <span style={styles.verdictIcon}>{verdictIcon}</span>
        <div>
          <p style={styles.verdictLabel}>Diagnosis Result</p>
          <p style={{ ...styles.verdictText, color: verdictColor }}>
            {result.verdict}
          </p>
        </div>
        <div style={styles.confidenceCircle}>
          <svg viewBox="0 0 40 40" style={styles.svg}>
            <circle cx="20" cy="20" r="16" fill="none" stroke="#e0edec" strokeWidth="4" />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke={verdictColor}
              strokeWidth="4"
              strokeDasharray={`${(result.confidence / 100) * 100.5} 100.5`}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
            />
          </svg>
          <span style={{ ...styles.confidenceNum, color: verdictColor }}>
            {result.confidence}%
          </span>
        </div>
      </div>

      {/* ── Disease type (from AI model) ── */}
      {result.disease_type && result.disease_type !== "Normal" && (
        <div style={{
          margin: "12px 0 0",
          padding: "10px 16px",
          background: "rgba(220,38,38,0.07)",
          border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span style={{ fontSize: "1.2rem" }}>🔬</span>
          <div>
            <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Detected Condition
            </p>
            <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#7f1d1d" }}>
              {result.disease_type}
            </p>
          </div>
        </div>
      )}

      {/* ── Primary finding ── */}
      <div style={styles.findingBox}>
        <p style={styles.findingLabel}>Primary Finding</p>
        <p style={styles.findingText}>{result.primary_finding}</p>
      </div>

      {/* ── Indicators ── */}
      {result.indicators?.length > 0 && (
        <div style={styles.indicatorsSection}>
          <p style={styles.sectionLabel}>Diagnostic Indicators</p>
          <div style={styles.indicatorList}>
            {result.indicators.map((ind, i) => (
              <div key={i} style={styles.indicatorRow}>
                <span style={styles.indicatorLabel}>{ind.label}</span>
                <div style={styles.indicatorRight}>
                  <span style={styles.indicatorValue}>{ind.value}</span>
                  <span
                    style={{
                      ...styles.statusPill,
                      background:
                        ind.status === "normal"
                          ? "rgba(10,191,170,0.12)"
                          : ind.status === "abnormal"
                          ? "rgba(255,107,107,0.12)"
                          : "rgba(245,166,35,0.12)",
                      color:
                        ind.status === "normal"
                          ? "#089082"
                          : ind.status === "abnormal"
                          ? "#d94f4f"
                          : "#c47a00",
                    }}
                  >
                    {ind.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recommendation ── */}
      <div style={styles.recommendBox}>
        <p style={styles.sectionLabel}>Clinical Recommendation</p>
        <p style={styles.recommendText}>
          {result.recommendation}
        </p>
      </div>

      {/* ── Meta row ── */}
      <div style={styles.metaRow}>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>Image Quality</span>
          <span
            style={{
              ...styles.metaValue,
              color:
                result.image_quality === "good"
                  ? "#0abfaa"
                  : result.image_quality === "poor"
                  ? "#ff6b6b"
                  : "#f5a623",
            }}
          >
            {result.image_quality?.toUpperCase()}
          </span>
        </div>
        <div style={styles.metaItem}>
          <span style={styles.metaLabel}>Confidence</span>
          <span style={{ ...styles.metaValue, color: verdictColor }}>
            {result.confidence}%
          </span>
        </div>
      </div>

      {/* ── Note ── */}
      {result.note && (
        <p style={styles.noteText}>📌 {result.note}</p>
      )}

      {/* ── Actions ── */}
      <div style={styles.actions}>
        <button style={styles.newBtn} onClick={onReset} type="button">
          ↩ Analyze New Scan
        </button>
        <button
          style={styles.printBtn}
          onClick={() => window.print()}
          type="button"
        >
          🖨 Print Report
        </button>
      </div>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7fafa",
    fontFamily: '"DM Sans", sans-serif',
    color: "#1a2e3b",
  },
  header: {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #e0edec",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 5%",
    height: 68,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
  },
  logoIcon: { fontSize: "1.4rem" },
  logoText: {
    fontFamily: '"DM Serif Display", serif',
    fontSize: "1.3rem",
    color: "#0d2b45",
    fontWeight: 400,
  },
  logoDivider: { color: "#e0edec", fontSize: "1.2rem", margin: "0 4px" },
  logoSub: { fontSize: "0.88rem", color: "#5e7b8c", fontWeight: 500 },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    background: "rgba(10,191,170,0.1)",
    border: "1px solid rgba(10,191,170,0.25)",
    borderRadius: 50,
    padding: "6px 14px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#089082",
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#0abfaa",
    display: "inline-block",
    animation: "pulse 2s infinite",
  },
  main: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "48px 5% 64px",
  },
  titleBlock: { textAlign: "center", marginBottom: 48 },
  eyebrow: {
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#0abfaa",
    textTransform: "uppercase",
    marginBottom: 10,
    margin: "0 0 10px",
  },
  title: {
    fontFamily: '"DM Serif Display", serif',
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
    color: "#0d2b45",
    margin: "0 0 14px",
    fontWeight: 400,
  },
  subtitle: {
    color: "#5e7b8c",
    fontSize: "1rem",
    maxWidth: 520,
    margin: "0 auto",
    lineHeight: 1.65,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 32,
    alignItems: "start",
  },
  leftCol: { display: "flex", flexDirection: "column", gap: 16 },
  rightCol: { minHeight: 480 },

  // Dropzone
  dropzone: {
    border: "2px dashed #e0edec",
    borderRadius: 16,
    background: "#fafefe",
    minHeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s, background 0.2s",
  },
  dropzoneFilled: {
    border: "2px solid #e0edec",
    background: "#000",
  },
  dropPlaceholder: { textAlign: "center", padding: "32px 24px" },
  dropIcon: { fontSize: "3.5rem", marginBottom: 14 },
  dropTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#0d2b45",
    marginBottom: 6,
    margin: "0 0 6px",
  },
  dropHint: { fontSize: "0.85rem", color: "#5e7b8c", marginBottom: 20, margin: "0 0 20px" },
  browseBtn: {
    background: "#0abfaa",
    color: "white",
    border: "none",
    borderRadius: 50,
    padding: "10px 24px",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
    fontFamily: '"DM Sans", sans-serif',
  },
  preview: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    minHeight: 280,
    maxHeight: 400,
    display: "block",
  },
  changeOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s",
    color: "white",
    fontWeight: 600,
    fontSize: "0.95rem",
  },

  // File info
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "white",
    border: "1px solid #e0edec",
    borderRadius: 10,
    padding: "10px 14px",
  },
  fileInfoIcon: { fontSize: "1.4rem" },
  fileName: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#0d2b45",
    margin: 0,
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: { fontSize: "0.78rem", color: "#5e7b8c", margin: 0 },
  removeBtn: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#5e7b8c",
    fontSize: "1rem",
    padding: "4px 8px",
    borderRadius: 6,
  },

  // Analyze button
  analyzeBtn: {
    width: "100%",
    padding: "15px 24px",
    background: "linear-gradient(135deg, #0abfaa, #089082)",
    border: "none",
    borderRadius: 50,
    color: "white",
    fontWeight: 700,
    fontSize: "1rem",
    fontFamily: '"DM Sans", sans-serif',
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: "0 6px 24px rgba(10,191,170,0.35)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  analyzeBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  btnIcon: { fontSize: "1.1rem" },
  btnSpinner: {
    width: 18,
    height: 18,
    border: "2.5px solid rgba(255,255,255,0.35)",
    borderTopColor: "white",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },

  // Progress
  progressWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    background: "#e0edec",
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #0abfaa, #089082)",
    borderRadius: 99,
    transition: "width 0.3s ease",
  },
  progressLabel: { fontSize: "0.78rem", fontWeight: 700, color: "#0abfaa", minWidth: 34 },

  // Log
  logBox: {
    background: "#0d2b45",
    borderRadius: 10,
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  logLine: {
    fontSize: "0.8rem",
    color: "#a8c5bc",
    fontFamily: "monospace",
    margin: 0,
    animation: "fadeInUp 0.3s ease",
  },
  errorMsg: {
    color: "#d94f4f",
    fontSize: "0.88rem",
    background: "rgba(255,107,107,0.08)",
    border: "1px solid rgba(255,107,107,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    margin: 0,
  },

  // Empty state
  emptyState: {
    background: "white",
    border: "1px solid #e0edec",
    borderRadius: 16,
    padding: "48px 36px",
    textAlign: "center",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyIcon: { fontSize: "4rem" },
  emptyTitle: { fontSize: "1.15rem", fontWeight: 600, color: "#0d2b45", margin: 0 },
  emptyText: { fontSize: "0.9rem", color: "#5e7b8c", maxWidth: 300, lineHeight: 1.6, margin: 0 },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 8,
    width: "100%",
    maxWidth: 280,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#f7fafa",
    border: "1px solid #e0edec",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: "0.85rem",
    color: "#5e7b8c",
    fontWeight: 500,
  },

  // Loading state
  loadingState: {
    background: "white",
    border: "1px solid #e0edec",
    borderRadius: 16,
    padding: "48px 36px",
    textAlign: "center",
    minHeight: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scanAnimation: {
    width: 80,
    height: 80,
    background: "rgba(10,191,170,0.08)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    background: "linear-gradient(90deg, transparent, #0abfaa, transparent)",
    animation: "scanMove 1.5s ease-in-out infinite",
  },
  scanEmoji: { fontSize: "2.2rem", zIndex: 1 },
  loadingTitle: { fontSize: "1.1rem", fontWeight: 600, color: "#0d2b45", margin: 0 },
  loadingText: {
    fontSize: "0.875rem",
    color: "#5e7b8c",
    maxWidth: 300,
    lineHeight: 1.6,
    margin: 0,
  },

  // Result card
  resultCard: {
    background: "white",
    border: "1px solid #e0edec",
    borderRadius: 16,
    padding: "28px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  verdictBanner: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    border: "1.5px solid",
    borderRadius: 12,
    padding: "16px 20px",
  },
  verdictIcon: { fontSize: "2rem" },
  verdictLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#5e7b8c",
    margin: "0 0 4px",
  },
  verdictText: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: 0,
    fontFamily: '"DM Serif Display", serif',
  },
  confidenceCircle: {
    marginLeft: "auto",
    position: "relative",
    width: 56,
    height: 56,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  svg: { position: "absolute", inset: 0, width: "100%", height: "100%" },
  confidenceNum: {
    fontSize: "0.82rem",
    fontWeight: 700,
    position: "relative",
    zIndex: 1,
  },
  findingBox: {
    background: "#f7fafa",
    border: "1px solid #e0edec",
    borderRadius: 10,
    padding: "14px 16px",
  },
  findingLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#5e7b8c",
    margin: "0 0 6px",
  },
  findingText: { fontSize: "0.92rem", color: "#1a2e3b", lineHeight: 1.6, margin: 0 },
  indicatorsSection: {},
  sectionLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#5e7b8c",
    margin: "0 0 10px",
  },
  indicatorList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  indicatorRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    background: "#f7fafa",
    border: "1px solid #e0edec",
    borderRadius: 8,
  },
  indicatorLabel: { fontSize: "0.85rem", color: "#1a2e3b", fontWeight: 500 },
  indicatorRight: { display: "flex", alignItems: "center", gap: 8 },
  indicatorValue: { fontSize: "0.82rem", color: "#5e7b8c" },
  statusPill: {
    fontSize: "0.72rem",
    fontWeight: 700,
    borderRadius: 99,
    padding: "3px 10px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  recommendBox: {
    background: "rgba(10,191,170,0.06)",
    border: "1px solid rgba(10,191,170,0.2)",
    borderRadius: 10,
    padding: "14px 16px",
  },
  recommendText: {
    fontSize: "0.88rem",
    color: "#1a2e3b",
    lineHeight: 1.65,
    margin: 0,
  },
  metaRow: {
    display: "flex",
    gap: 16,
  },
  metaItem: {
    flex: 1,
    background: "#f7fafa",
    border: "1px solid #e0edec",
    borderRadius: 10,
    padding: "12px 14px",
    textAlign: "center",
  },
  metaLabel: {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#5e7b8c",
    marginBottom: 4,
  },
  metaValue: { fontSize: "1rem", fontWeight: 700 },
  noteText: {
    fontSize: "0.82rem",
    color: "#5e7b8c",
    background: "#f7fafa",
    border: "1px solid #e0edec",
    borderRadius: 8,
    padding: "10px 14px",
    lineHeight: 1.55,
    margin: 0,
  },
  actions: { display: "flex", gap: 12 },
  newBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "#0abfaa",
    color: "white",
    border: "none",
    borderRadius: 50,
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
    fontFamily: '"DM Sans", sans-serif',
  },
  printBtn: {
    padding: "12px 20px",
    background: "transparent",
    color: "#0d2b45",
    border: "1.5px solid #e0edec",
    borderRadius: 50,
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
    fontFamily: '"DM Sans", sans-serif',
  },

  disclaimer: {
    textAlign: "center",
    fontSize: "0.78rem",
    color: "#5e7b8c",
    marginTop: 48,
    maxWidth: 600,
    marginLeft: "auto",
    marginRight: "auto",
    lineHeight: 1.6,
  },
};

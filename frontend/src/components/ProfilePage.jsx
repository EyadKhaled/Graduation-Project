import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { uploadService } from "../services/upload.service.js";

const API = import.meta.env.VITE_API_BASE_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const verdictColor = (v) =>
  v === "Healthy" ? "#0abfaa" : v === "Diseased" ? "#ff6b6b" : "#f5a623";
const verdictBg = (v) =>
  v === "Healthy" ? "rgba(10,191,170,0.1)" : v === "Diseased" ? "rgba(255,107,107,0.1)" : "rgba(245,166,35,0.1)";
const verdictIcon = (v) =>
  v === "Healthy" ? "✅" : v === "Diseased" ? "⚠️" : "❓";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("analyses");
  const [uploads, setUploads] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingMedical, setLoadingMedical] = useState(true);

  useEffect(() => {
    // Load uploads
    uploadService
      .getHistory()
      .then(setUploads)
      .catch(() => {})
      .finally(() => setLoadingUploads(false));

    // Load AI reports (analyses) from analysis endpoint
    const token = localStorage.getItem("access_token");
    fetch(`${API}/analysis/`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    })
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : data.reports || [];
        setAnalyses(arr.map((a) => ({ ...a, date: a.createdAt || a.date })));
      })
      .catch(() => {})
      .finally(() => setLoadingAnalyses(false));

    // Load medical history (patient reports)
    fetch(`${API}/medical/history/`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    })
      .then((r) => r.json())
      .then((data) => {
        setMedicalRecords(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingMedical(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  const initials =
    user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : "??";

  const healthyCount  = analyses.filter((a) => a.verdict === "Healthy").length;
  const diseasedCount = analyses.filter((a) => a.verdict === "Diseased").length;
  const avgConfidence = analyses.length
    ? Math.round(analyses.reduce((s, a) => s + (a.confidence || 0), 0) / analyses.length)
    : 0;

  return (
    <div style={S.page}>
      {/* ── Navbar ── */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <button style={S.backBtn} onClick={() => navigate("/home")} type="button">← Back to Home</button>
          <div style={S.navLogo}><span>💚</span><span style={S.navLogoText}>GallCare</span></div>
          <button style={S.logoutBtn} onClick={handleLogout} type="button">Sign Out</button>
        </div>
      </header>

      <main style={S.main}>
        {/* ── Profile Hero ── */}
        <div style={S.profileHero}>
          <div style={S.heroBg} />
          <div style={S.heroContent}>
            <div style={S.avatar}>{initials}</div>
            <div style={S.heroInfo}>
              <h1 style={S.heroName}>{user?.first_name ?? "—"} {user?.last_name ?? ""}</h1>
              <p style={S.heroEmail}>{user?.email ?? "—"}</p>
              <div style={S.heroBadges}>
                <span style={S.badge}>🩺 Patient</span>
                <span style={S.badge}>📍 GallCare Member</span>
                {/* Verified badge */}
                <span style={{
                  ...S.badge,
                  background: user?.isVerified ? "rgba(10,191,170,0.2)" : "rgba(245,166,35,0.2)",
                  border: user?.isVerified ? "1px solid rgba(10,191,170,0.3)" : "1px solid rgba(245,166,35,0.3)",
                  color: user?.isVerified ? "#0abfaa" : "#f5a623",
                }}>
                  {user?.isVerified ? "✓ Verified" : "⏳ Unverified"}
                </span>
              </div>
            </div>
            <div style={S.heroStats}>
              <div style={S.statBox}>
                <span style={{ ...S.statNum, color: "#0abfaa" }}>{analyses.length}</span>
                <span style={S.statLabel}>Total Scans</span>
              </div>
              <div style={S.statDivider} />
              <div style={S.statBox}>
                <span style={{ ...S.statNum, color: "#0abfaa" }}>{healthyCount}</span>
                <span style={S.statLabel}>Healthy</span>
              </div>
              <div style={S.statDivider} />
              <div style={S.statBox}>
                <span style={{ ...S.statNum, color: "#ff6b6b" }}>{diseasedCount}</span>
                <span style={S.statLabel}>Diseased</span>
              </div>
              <div style={S.statDivider} />
              <div style={S.statBox}>
                <span style={{ ...S.statNum, color: "#f5a623" }}>{avgConfidence}%</span>
                <span style={S.statLabel}>Avg. Confidence</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={S.tabBar}>
          {[
            { id: "analyses", icon: "🔬", label: "Analysis History" },
            { id: "uploads",  icon: "🖼️", label: "Uploaded Scans"  },
            { id: "medical",  icon: "📋", label: "Medical Reports"  },
            { id: "info",     icon: "👤", label: "Personal Info"   },
          ].map((tab) => (
            <button key={tab.id}
              style={{ ...S.tab, ...(activeTab === tab.id ? S.tabActive : {}) }}
              onClick={() => setActiveTab(tab.id)} type="button"
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={S.tabContent}>

          {/* ══ Analysis History Tab ══ */}
          {activeTab === "analyses" && (
            <div style={S.analysesLayout}>
              <div style={S.analysisList}>
                <div style={S.listHeader}>
                  <h2 style={S.listTitle}>Past Analyses</h2>
                  <button style={S.newScanBtn} onClick={() => navigate("/process")} type="button">+ New Scan</button>
                </div>

                {loadingAnalyses ? (
                  <div style={S.loadingRow}><div style={S.spinner} /><span style={{ color: "#5e7b8c" }}>Loading analyses…</span></div>
                ) : analyses.length === 0 ? (
                  <div style={S.emptyBox}>
                    <span style={{ fontSize: "3rem" }}>🩻</span>
                    <p style={S.emptyText}>No analyses yet. Upload a scan to get started.</p>
                    <button style={S.newScanBtn} onClick={() => navigate("/process")} type="button">Analyze a Scan</button>
                  </div>
                ) : (
                  analyses.map((a) => (
                    <div key={a._id || a.id}
                      style={{ ...S.analysisCard, ...(selectedAnalysis?._id === a._id ? S.analysisCardActive : {}) }}
                      onClick={() => setSelectedAnalysis(selectedAnalysis?._id === a._id ? null : a)}
                    >
                      <div style={{ ...S.verdictBadge, background: verdictBg(a.verdict), color: verdictColor(a.verdict), border: `1px solid ${verdictColor(a.verdict)}33` }}>
                        {verdictIcon(a.verdict)} {a.verdict}
                      </div>
                      <div style={S.cardMeta}>
                        <p style={S.cardImageName}>🩻 {a.image_name}</p>
                        <p style={S.cardDate}>{a.date ? `${formatDate(a.date)} · ${formatTime(a.date)}` : "—"}</p>
                      </div>
                      <p style={S.cardFinding}>{a.primary_finding}</p>
                      <div style={S.confBar}>
                        <div style={S.confTrack}>
                          <div style={{ ...S.confFill, width: `${a.confidence}%`, background: verdictColor(a.verdict) }} />
                        </div>
                        <span style={{ ...S.confNum, color: verdictColor(a.verdict) }}>{a.confidence}%</span>
                      </div>
                      <p style={S.viewDetail}>{selectedAnalysis?._id === a._id ? "▲ Hide details" : "▼ View details"}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Detail Panel */}
              {selectedAnalysis && (
                <div style={S.detailPanel}>
                  <div style={S.detailHeader}>
                    <div style={{ ...S.detailVerdict, color: verdictColor(selectedAnalysis.verdict), background: verdictBg(selectedAnalysis.verdict), border: `1.5px solid ${verdictColor(selectedAnalysis.verdict)}44` }}>
                      <span style={{ fontSize: "2rem" }}>{verdictIcon(selectedAnalysis.verdict)}</span>
                      <div>
                        <p style={S.detailVerdictLabel}>Diagnosis</p>
                        <p style={{ ...S.detailVerdictText, color: verdictColor(selectedAnalysis.verdict) }}>{selectedAnalysis.verdict}</p>
                      </div>
                      <div style={S.detailConfidence}>
                        <span style={{ fontSize: "1.5rem", fontWeight: 700, color: verdictColor(selectedAnalysis.verdict) }}>{selectedAnalysis.confidence}%</span>
                        <span style={{ fontSize: "0.72rem", color: "#5e7b8c" }}>confidence</span>
                      </div>
                    </div>
                  </div>

                  <div style={S.detailSection}>
                    <p style={S.detailSectionLabel}>Primary Finding</p>
                    <p style={S.detailText}>{selectedAnalysis.primary_finding}</p>
                  </div>

                  {/* Disease type — shown only when AI returned a specific class */}
                  {selectedAnalysis.disease_type && selectedAnalysis.disease_type !== "Normal" && (
                    <div style={{ ...S.detailSection, background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)", borderRadius: 10, padding: "12px 16px" }}>
                      <p style={{ ...S.detailSectionLabel, color: "#b91c1c" }}>Detected Condition</p>
                      <p style={{ ...S.detailText, fontWeight: 700, color: "#7f1d1d" }}>🔬 {selectedAnalysis.disease_type}</p>
                    </div>
                  )}

                  {selectedAnalysis.indicators?.length > 0 && (
                    <div style={S.detailSection}>
                      <p style={S.detailSectionLabel}>Diagnostic Indicators</p>
                      {selectedAnalysis.indicators.map((ind, i) => (
                        <div key={i} style={S.indRow}>
                          <span style={S.indLabel}>{ind.label}</span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={S.indValue}>{ind.value}</span>
                            <span style={{ ...S.statusPill, background: ind.status === "normal" ? "rgba(10,191,170,0.12)" : ind.status === "abnormal" ? "rgba(255,107,107,0.12)" : "rgba(245,166,35,0.12)", color: ind.status === "normal" ? "#089082" : ind.status === "abnormal" ? "#d94f4f" : "#c47a00" }}>
                              {ind.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={S.detailSection}>
                    <p style={S.detailSectionLabel}>Clinical Recommendation</p>
                    <div style={S.recommendBox}><p style={S.detailText}>{selectedAnalysis.recommendation}</p></div>
                  </div>

                  {selectedAnalysis.note && (
                    <div style={S.detailSection}>
                      <p style={S.detailSectionLabel}>Note</p>
                      <p style={{ ...S.detailText, color: "#5e7b8c" }}>📌 {selectedAnalysis.note}</p>
                    </div>
                  )}

                  <div style={S.detailMeta}>
                    <span style={S.detailMetaItem}>📅 {selectedAnalysis.date ? formatDate(selectedAnalysis.date) : "—"}</span>
                    <span style={S.detailMetaItem}>🕐 {selectedAnalysis.date ? formatTime(selectedAnalysis.date) : "—"}</span>
                    <span style={S.detailMetaItem}>📄 {selectedAnalysis.image_name}</span>
                    {selectedAnalysis.image_quality && (
                      <span style={S.detailMetaItem}>🖼 Quality: {selectedAnalysis.image_quality}</span>
                    )}
                  </div>

                  <button style={S.printBtn} onClick={() => window.print()} type="button">🖨 Print Report</button>
                </div>
              )}

              {!selectedAnalysis && analyses.length > 0 && (
                <div style={S.detailPlaceholder}>
                  <span style={{ fontSize: "3rem" }}>👆</span>
                  <p style={S.emptyText}>Select an analysis to view full details</p>
                </div>
              )}
            </div>
          )}

          {/* ══ Uploads Tab ══ */}
          {activeTab === "uploads" && (
            <div>
              <div style={S.listHeader}>
                <h2 style={S.listTitle}>Uploaded Scans</h2>
                <button style={S.newScanBtn} onClick={() => navigate("/process")} type="button">+ Upload &amp; Analyze</button>
              </div>

              {loadingUploads ? (
                <div style={S.loadingRow}><div style={S.spinner} /><span style={{ color: "#5e7b8c" }}>Loading uploads…</span></div>
              ) : uploads.length === 0 ? (
                <div style={S.emptyBox}>
                  <span style={{ fontSize: "3rem" }}>🖼️</span>
                  <p style={S.emptyText}>No uploads yet.</p>
                </div>
              ) : (
                <div style={S.uploadsGrid}>
                  {uploads.map((item, i) => {
                    // Find matching analysis for this upload
                    const matchedAnalysis = analyses.find(
                      (a) => a.upload === (item._id || item.id) || a.image_name === (item.file_name || item.name)
                    );
                    return (
                      <div key={item.id || item._id || i} style={S.uploadCard}>
                        <div style={S.uploadThumb}>🩻</div>
                        <div style={S.uploadInfo}>
                          <p style={S.uploadName}>{item.file_name || item.name}</p>
                          <p style={S.uploadMeta}>
                            {item.file_type?.toUpperCase() || "FILE"} ·{" "}
                            {item.size
                              ? item.size < 1024 * 1024 ? `${(item.size / 1024).toFixed(1)} KB` : `${(item.size / 1024 / 1024).toFixed(1)} MB`
                              : "—"}
                          </p>
                          <p style={S.uploadDate}>{item.created_at || item.createdAt ? formatDate(item.created_at || item.createdAt) : "—"}</p>

                          {/* AI Analysis Data for this image */}
                          {matchedAnalysis && (
                            <div style={S.uploadAnalysisBox}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ ...S.uploadVerdictPill, background: verdictBg(matchedAnalysis.verdict), color: verdictColor(matchedAnalysis.verdict) }}>
                                  {verdictIcon(matchedAnalysis.verdict)} {matchedAnalysis.verdict}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: verdictColor(matchedAnalysis.verdict), fontWeight: 700 }}>
                                  {matchedAnalysis.confidence}% confidence
                                </span>
                              </div>
                              <p style={S.uploadFinding}>{matchedAnalysis.primary_finding}</p>
                              {matchedAnalysis.recommendation && (
                                <p style={{ ...S.uploadFinding, color: "#089082", marginTop: 4 }}>
                                  💊 {matchedAnalysis.recommendation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <button style={S.analyzeSmallBtn} onClick={() => navigate("/process")} type="button">
                          {matchedAnalysis ? "Re-Analyze" : "Analyze"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ Medical Reports Tab ══ */}
          {activeTab === "medical" && (
            <div>
              <div style={S.listHeader}>
                <h2 style={S.listTitle}>My Medical Records</h2>
                <button style={S.newScanBtn} onClick={() => { window.location.href = "/home#history"; }} type="button">+ Submit New</button>
              </div>

              {loadingMedical ? (
                <div style={S.loadingRow}><div style={S.spinner} /><span style={{ color: "#5e7b8c" }}>Loading records…</span></div>
              ) : medicalRecords.length === 0 ? (
                <div style={S.emptyBox}>
                  <span style={{ fontSize: "3rem" }}>📋</span>
                  <p style={S.emptyText}>No medical records submitted yet. Fill out the Medical History form on the home page.</p>
                  <button style={S.newScanBtn} onClick={() => navigate("/home")} type="button">Go to Home</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
                  {medicalRecords.map((rec) => (
                    <div key={rec._id || rec.id} style={{
                      background: "white", border: "1px solid #e0edec", borderRadius: 14,
                      padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: "#0d2b45", fontSize: "1rem" }}>
                            {rec.first_name} {rec.last_name}
                          </p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#5e7b8c" }}>
                            {rec.email} · DOB: {rec.date_of_birth || "—"} · {rec.gender || ""}
                          </p>
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#5e7b8c", background: "#f7fafa", border: "1px solid #e0edec", borderRadius: 8, padding: "4px 12px" }}>
                          📅 {rec.createdAt ? formatDate(rec.createdAt) : "—"}
                        </span>
                      </div>
                      {rec.phone && (
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#5e7b8c" }}>📞 {rec.phone}</p>
                      )}
                      {rec.symptoms && (
                        <div style={{ background: "#f7fafa", border: "1px solid #e0edec", borderRadius: 10, padding: "12px 16px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#5e7b8c" }}>Symptoms</p>
                          <p style={{ margin: 0, fontSize: "0.88rem", color: "#1a2e3b", lineHeight: 1.65 }}>{rec.symptoms}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ Personal Info Tab ══ */}
          {activeTab === "info" && (
            <div style={S.infoGrid}>
              <div style={S.infoCard}>
                <h3 style={S.infoCardTitle}>👤 Account Information</h3>
                <div style={S.infoRows}>
                  {[
                    ["First Name", user?.first_name ?? "—"],
                    ["Last Name", user?.last_name ?? "—"],
                    ["Email Address", user?.email ?? "—"],
                    ["Member Since", user?.createdAt ? formatDate(user.createdAt) : "2025"],
                  ].map(([label, value]) => (
                    <div key={label} style={S.infoRow}>
                      <span style={S.infoLabel}>{label}</span>
                      <span style={S.infoValue}>{value}</span>
                    </div>
                  ))}
                  {/* Verified status row */}
                  <div style={S.infoRow}>
                    <span style={S.infoLabel}>Email Verified</span>
                    <span style={{
                      ...S.infoValue,
                      color: user?.isVerified ? "#0abfaa" : "#f5a623",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      {user?.isVerified ? (
                        <><span style={{ ...S.verifiedPill, background: "rgba(10,191,170,0.12)", color: "#089082" }}>✓ Yes — Verified</span></>
                      ) : (
                        <><span style={{ ...S.verifiedPill, background: "rgba(245,166,35,0.12)", color: "#c47a00" }}>⏳ No — Pending</span></>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div style={S.infoCard}>
                <h3 style={S.infoCardTitle}>📊 Analysis Summary</h3>
                <div style={S.summaryGrid}>
                  {[
                    { label: "Total Analyses",   value: analyses.length,   color: "#0abfaa" },
                    { label: "Healthy Results",  value: healthyCount,      color: "#0abfaa" },
                    { label: "Diseased Results", value: diseasedCount,     color: "#ff6b6b" },
                    { label: "Avg. Confidence",  value: `${avgConfidence}%`, color: "#f5a623" },
                  ].map((s) => (
                    <div key={s.label} style={S.summaryItem}>
                      <span style={{ ...S.summaryNum, color: s.color }}>{s.value}</span>
                      <span style={S.summaryLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...S.infoCard, gridColumn: "1 / -1" }}>
                <h3 style={S.infoCardTitle}>⚙️ Actions</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button style={S.actionBtn} onClick={() => navigate("/process")} type="button">🔬 New Analysis</button>
                  <button style={S.actionBtn} onClick={() => navigate("/home")} type="button">🏠 Go to Home</button>
                  <button style={{ ...S.actionBtn, ...S.actionBtnDanger }} onClick={handleLogout} type="button">🚪 Sign Out</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <p style={S.disclaimer}>
        ⚕ Results are AI-generated and for informational purposes only. Always consult a qualified physician.
      </p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "#f7fafa", fontFamily: '"DM Sans", sans-serif', color: "#1a2e3b" },
  nav: { background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e0edec", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1100, margin: "0 auto", padding: "0 5%", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn: { background: "transparent", border: "1px solid #e0edec", borderRadius: 50, padding: "8px 18px", fontSize: "0.85rem", fontWeight: 600, color: "#5e7b8c", cursor: "pointer", fontFamily: "inherit" },
  navLogo: { display: "flex", alignItems: "center", gap: 8, fontSize: "1.3rem" },
  navLogoText: { fontFamily: '"DM Serif Display", serif', color: "#0d2b45", fontWeight: 400 },
  logoutBtn: { background: "transparent", border: "1.5px solid #e0edec", borderRadius: 50, padding: "8px 20px", fontSize: "0.85rem", fontWeight: 600, color: "#0d2b45", cursor: "pointer", fontFamily: "inherit" },
  profileHero: { position: "relative", overflow: "hidden", marginBottom: 0 },
  heroBg: { position: "absolute", inset: 0, background: "linear-gradient(135deg, #0d2b45 0%, #163552 60%, #0a4040 100%)" },
  heroContent: { position: "relative", maxWidth: 1100, margin: "0 auto", padding: "48px 5%", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" },
  avatar: { width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #0abfaa, #089082)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, flexShrink: 0, boxShadow: "0 0 0 4px rgba(10,191,170,0.3)" },
  heroInfo: { flex: 1 },
  heroName: { fontFamily: '"DM Serif Display", serif', fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "white", margin: "0 0 6px", fontWeight: 400 },
  heroEmail: { color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", margin: "0 0 12px" },
  heroBadges: { display: "flex", gap: 10, flexWrap: "wrap" },
  badge: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", borderRadius: 50, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 600 },
  heroStats: { display: "flex", alignItems: "center", gap: 0, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "18px 28px", flexShrink: 0 },
  statBox: { textAlign: "center", padding: "0 20px" },
  statNum: { display: "block", fontSize: "1.6rem", fontWeight: 700, fontFamily: '"DM Serif Display", serif' },
  statLabel: { fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" },
  statDivider: { width: 1, height: 40, background: "rgba(255,255,255,0.15)" },
  main: { maxWidth: 1100, margin: "0 auto", padding: "0 5% 64px" },
  tabBar: { display: "flex", gap: 4, background: "white", border: "1px solid #e0edec", borderTop: "none", padding: "0 4px", position: "sticky", top: 68, zIndex: 50 },
  tab: { padding: "16px 22px", background: "transparent", border: "none", borderBottom: "2px solid transparent", fontSize: "0.88rem", fontWeight: 600, color: "#5e7b8c", cursor: "pointer", fontFamily: "inherit", transition: "color 0.2s, border-color 0.2s", display: "flex", alignItems: "center", gap: 8 },
  tabActive: { color: "#0abfaa", borderBottomColor: "#0abfaa" },
  tabContent: { paddingTop: 32 },
  analysesLayout: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" },
  analysisList: { display: "flex", flexDirection: "column", gap: 12 },
  listHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  listTitle: { fontSize: "1.1rem", fontWeight: 700, color: "#0d2b45", margin: 0 },
  newScanBtn: { background: "#0abfaa", color: "white", border: "none", borderRadius: 50, padding: "9px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  analysisCard: { background: "white", border: "1.5px solid #e0edec", borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s", display: "flex", flexDirection: "column", gap: 10 },
  analysisCardActive: { borderColor: "#0abfaa", boxShadow: "0 0 0 3px rgba(10,191,170,0.1)" },
  verdictBadge: { display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 50, padding: "4px 14px", fontSize: "0.78rem", fontWeight: 700, alignSelf: "flex-start" },
  cardMeta: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardImageName: { fontSize: "0.85rem", fontWeight: 600, color: "#0d2b45", margin: 0 },
  cardDate: { fontSize: "0.78rem", color: "#5e7b8c", margin: 0 },
  cardFinding: { fontSize: "0.85rem", color: "#5e7b8c", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  confBar: { display: "flex", alignItems: "center", gap: 10 },
  confTrack: { flex: 1, height: 5, background: "#e0edec", borderRadius: 99, overflow: "hidden" },
  confFill: { height: "100%", borderRadius: 99, transition: "width 0.6s ease" },
  confNum: { fontSize: "0.78rem", fontWeight: 700, minWidth: 34 },
  viewDetail: { fontSize: "0.75rem", color: "#0abfaa", margin: 0, fontWeight: 600, textAlign: "right" },
  detailPanel: { background: "white", border: "1.5px solid #e0edec", borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 120 },
  detailPlaceholder: { background: "white", border: "1.5px dashed #e0edec", borderRadius: 16, minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 },
  detailHeader: {},
  detailVerdict: { display: "flex", alignItems: "center", gap: 14, borderRadius: 12, padding: "16px 20px" },
  detailVerdictLabel: { fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5e7b8c", margin: "0 0 4px" },
  detailVerdictText: { fontSize: "1.4rem", fontWeight: 700, margin: 0, fontFamily: '"DM Serif Display", serif' },
  detailConfidence: { marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" },
  detailSection: {},
  detailSectionLabel: { fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5e7b8c", margin: "0 0 8px" },
  detailText: { fontSize: "0.9rem", color: "#1a2e3b", lineHeight: 1.65, margin: 0 },
  indRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f7fafa", border: "1px solid #e0edec", borderRadius: 8, marginBottom: 6 },
  indLabel: { fontSize: "0.85rem", color: "#1a2e3b", fontWeight: 500 },
  indValue: { fontSize: "0.82rem", color: "#5e7b8c" },
  statusPill: { fontSize: "0.7rem", fontWeight: 700, borderRadius: 99, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.06em" },
  recommendBox: { background: "rgba(10,191,170,0.06)", border: "1px solid rgba(10,191,170,0.2)", borderRadius: 10, padding: "12px 16px" },
  detailMeta: { display: "flex", gap: 12, flexWrap: "wrap", borderTop: "1px solid #e0edec", paddingTop: 14 },
  detailMetaItem: { fontSize: "0.78rem", color: "#5e7b8c", background: "#f7fafa", border: "1px solid #e0edec", borderRadius: 8, padding: "5px 12px" },
  printBtn: { width: "100%", padding: "12px", background: "transparent", border: "1.5px solid #e0edec", borderRadius: 50, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit", color: "#0d2b45" },
  uploadsGrid: { display: "flex", flexDirection: "column", gap: 10, marginTop: 16 },
  uploadCard: { background: "white", border: "1px solid #e0edec", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 14 },
  uploadThumb: { width: 44, height: 44, borderRadius: 10, background: "rgba(10,191,170,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0, marginTop: 2 },
  uploadInfo: { flex: 1 },
  uploadName: { fontSize: "0.9rem", fontWeight: 600, color: "#0d2b45", margin: 0, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  uploadMeta: { fontSize: "0.78rem", color: "#5e7b8c", margin: "2px 0 0" },
  uploadDate: { fontSize: "0.75rem", color: "#5e7b8c", margin: "2px 0 6px" },
  uploadAnalysisBox: { background: "#f7fafa", border: "1px solid #e0edec", borderRadius: 8, padding: "10px 12px", marginTop: 6 },
  uploadVerdictPill: { fontSize: "0.75rem", fontWeight: 700, borderRadius: 99, padding: "3px 10px" },
  uploadFinding: { fontSize: "0.8rem", color: "#5e7b8c", margin: 0, lineHeight: 1.5 },
  analyzeSmallBtn: { background: "rgba(10,191,170,0.1)", color: "#089082", border: "1px solid rgba(10,191,170,0.25)", borderRadius: 50, padding: "6px 18px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, marginTop: 4 },
  infoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  infoCard: { background: "white", border: "1px solid #e0edec", borderRadius: 16, padding: "24px" },
  infoCardTitle: { fontSize: "1rem", fontWeight: 700, color: "#0d2b45", margin: "0 0 18px" },
  infoRows: { display: "flex", flexDirection: "column", gap: 0 },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f5f5" },
  infoLabel: { fontSize: "0.85rem", color: "#5e7b8c", fontWeight: 500 },
  infoValue: { fontSize: "0.9rem", color: "#0d2b45", fontWeight: 600 },
  verifiedPill: { fontSize: "0.82rem", fontWeight: 700, borderRadius: 99, padding: "4px 14px" },
  summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  summaryItem: { background: "#f7fafa", border: "1px solid #e0edec", borderRadius: 10, padding: "14px", textAlign: "center" },
  summaryNum: { display: "block", fontSize: "1.5rem", fontWeight: 700, fontFamily: '"DM Serif Display", serif', marginBottom: 4 },
  summaryLabel: { fontSize: "0.75rem", color: "#5e7b8c", fontWeight: 600 },
  actionBtn: { background: "#0abfaa", color: "white", border: "none", borderRadius: 50, padding: "10px 22px", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  actionBtnDanger: { background: "transparent", color: "#d94f4f", border: "1.5px solid #ffd0d0" },
  emptyBox: { background: "white", border: "1.5px dashed #e0edec", borderRadius: 14, padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  emptyText: { fontSize: "0.9rem", color: "#5e7b8c", margin: 0, lineHeight: 1.6 },
  loadingRow: { display: "flex", alignItems: "center", gap: 12, padding: "32px", justifyContent: "center" },
  spinner: { width: 22, height: 22, border: "2.5px solid #e0edec", borderTopColor: "#0abfaa", borderRadius: "50%", animation: "spin 0.7s linear infinite" },
  disclaimer: { textAlign: "center", fontSize: "0.75rem", color: "#5e7b8c", padding: "0 5% 32px", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" },
};

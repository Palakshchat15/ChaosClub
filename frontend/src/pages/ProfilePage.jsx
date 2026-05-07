import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "../lib/animations";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const auth = getAuth();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const statsRef = useRef(null);

  useEffect(() => {
    if (!auth) return;
    async function loadProfile() {
      try {
        const [prof, hist] = await Promise.all([
          api.get(`/api/users/${auth.user_id}/profile`),
          api.get(`/api/users/${auth.user_id}/predictions`)
        ]);
        setProfile(prof);
        setHistory(hist);
        setBioInput(prof.bio || "");
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    if (!loading && statsRef.current) {
      gsap.fromTo(".stat-card", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [loading]);

  async function handleUpdateBio() {
    try {
      await api.put(`/api/users/${auth.user_id}/bio`, { bio: bioInput });
      setProfile(prev => ({ ...prev, bio: bioInput }));
      setEditingBio(false);
    } catch (err) {
      alert("Failed to update bio");
    }
  }

  if (!auth) {
    return (
      <section className="section" style={{ textAlign: "center", paddingTop: "100px" }}>
        <h2>Access Denied</h2>
        <p className="muted">Please log in to view your profile.</p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="section" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loader" />
      </div>
    );
  }

  return (
    <section className="section" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* ── Header ── */}
      <div className="card" style={{ 
        display: "flex", 
        gap: "30px", 
        padding: "40px", 
        alignItems: "center",
        background: "linear-gradient(135deg, rgba(82,255,26,0.05) 0%, rgba(0,242,255,0.05) 100%)",
        border: "1px solid rgba(255,255,255,0.05)",
        marginBottom: "30px"
      }}>
        <div style={{ position: "relative" }}>
          <div style={{ 
            width: "120px", 
            height: "120px", 
            borderRadius: "50%", 
            overflow: "hidden", 
            border: "3px solid var(--primary)",
            boxShadow: "0 0 20px rgba(82,255,26,0.3)"
          }}>
            <img 
              src={profile.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=" + profile.name} 
              alt={profile.name} 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          </div>
          <div style={{ 
            position: "absolute", 
            bottom: "5px", 
            right: "5px", 
            width: "24px", 
            height: "24px", 
            background: "var(--primary)", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            border: "2px solid #141925"
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#141925" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="section-eyebrow" style={{ color: "var(--primary)" }}>Fan Profile</div>
          <h1 style={{ margin: "5px 0 15px 0", fontSize: "36px" }}>{profile.name}</h1>
          
          {editingBio ? (
            <div className="stack" style={{ gap: "10px" }}>
              <textarea 
                className="form-input" 
                value={bioInput} 
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                style={{ background: "rgba(0,0,0,0.2)" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-primary" onClick={handleUpdateBio} style={{ padding: "6px 15px", fontSize: "12px" }}>Save</button>
                <button className="btn" onClick={() => setEditingBio(false)} style={{ padding: "6px 15px", fontSize: "12px" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditingBio(true)} style={{ cursor: "pointer", group: "true" }}>
              <p className="muted" style={{ margin: 0, fontStyle: profile.bio ? "normal" : "italic" }}>
                {profile.bio || "Click to add a bio..."}
              </p>
            </div>
          )}
        </div>

        {/* Trophy Cabinet Mini */}
        <div className="stack" style={{ alignItems: "center", gap: "12px" }}>
           <div className="section-eyebrow" style={{ fontSize: "10px" }}>BADGES</div>
           <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
             {profile.badges.length > 0 ? profile.badges.map((b, i) => {
                const badgeIcons = {
                  "Centurion": "💯",
                  "Club Legend": "👑",
                  "Sharpshooter": "🎯",
                  "Sniper": "🔭",
                  "Monthly Star": "⭐"
                };
                return (
                  <div key={i} title={b} style={{ 
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <div style={{ 
                      width: "44px", 
                      height: "44px", 
                      background: "rgba(255,255,255,0.05)", 
                      borderRadius: "50%", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      border: "1px solid rgba(82,255,26,0.3)",
                      fontSize: "20px",
                      boxShadow: "0 0 10px rgba(82,255,26,0.1)"
                    }}>
                      {badgeIcons[b] || "🏆"}
                    </div>
                    <span style={{ fontSize: "9px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase" }}>{b}</span>
                  </div>
                );
             }) : (
               <div style={{ fontSize: "12px", color: "var(--muted)", opacity: 0.5 }}>No badges yet</div>
             )}
           </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div ref={statsRef} className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
        {[
          { label: "All-Time Pts", value: profile.stats.total_points, color: "var(--primary)" },
          { label: "Monthly Pts", value: profile.stats.monthly_points, color: "var(--secondary)" },
          { label: "Predictions", value: profile.stats.total_predictions, color: "#fff" },
          { label: "Accuracy", value: profile.stats.accuracy_percentage + "%", color: "#ffcc00" },
        ].map((s, i) => (
          <div key={i} className="card stat-card" style={{ textAlign: "center", padding: "24px" }}>
            <div className="muted" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>{s.label}</div>
            <div style={{ fontSize: "28px", fontWeight: "800", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Prediction History ── */}
      <div className="stack" style={{ gap: "20px" }}>
        <h2 style={{ fontSize: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: "var(--primary)" }}>●</span> Prediction History
        </h2>

        {history.length === 0 ? (
          <div className="card muted" style={{ textAlign: "center", padding: "40px" }}>
            No predictions made yet. <Link to="/predict" style={{ color: "var(--primary)" }}>Start predicting!</Link>
          </div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="card" style={{ 
              padding: "20px", 
              borderLeft: item.is_settled ? (item.prediction.result_pick === item.actual.result ? "4px solid var(--primary)" : "4px solid #ff4d4d") : "4px solid var(--muted)",
              background: "rgba(255,255,255,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "16px" }}>{item.teams}</div>
                  <div className="muted" style={{ fontSize: "12px" }}>{new Date(item.kickoff_at).toLocaleDateString()}</div>
                </div>
                {item.is_settled ? (
                   <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                     <div style={{ 
                       background: "var(--primary)",
                       color: "#141925",
                       padding: "4px 12px",
                       borderRadius: "20px",
                       fontSize: "12px",
                       fontWeight: "800",
                       boxShadow: "0 0 10px rgba(82,255,26,0.2)"
                     }}>
                       +{item.points_earned} PTS
                     </div>
                     <div style={{ 
                       background: item.prediction.result_pick === item.actual.result ? "rgba(82,255,26,0.1)" : "rgba(255,77,77,0.1)",
                       color: item.prediction.result_pick === item.actual.result ? "var(--primary)" : "#ff4d4d",
                       padding: "4px 12px",
                       borderRadius: "20px",
                       fontSize: "12px",
                       fontWeight: "700"
                     }}>
                       {item.prediction.result_pick === item.actual.result ? "SUCCESS" : "FAILED"}
                     </div>
                   </div>
                ) : (
                  <div style={{ background: "rgba(255,255,255,0.05)", color: "var(--muted)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
                    PENDING
                  </div>
                )}
              </div>

              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px" }}>
                  <div className="muted" style={{ fontSize: "10px", marginBottom: "4px" }}>YOUR PICK</div>
                  <div style={{ fontSize: "14px" }}>
                    Result: <span style={{ color: "var(--accent)", fontWeight: "600" }}>{item.prediction.result_pick.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: "14px" }}>Score: {item.prediction.score}</div>
                  <div style={{ fontSize: "12px" }} className="muted">Scorers: {item.prediction.goalscorers.join(", ") || "None"}</div>
                </div>

                {item.is_settled ? (
                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px", borderRadius: "8px" }}>
                    <div className="muted" style={{ fontSize: "10px", marginBottom: "4px" }}>ACTUAL RESULT</div>
                    <div style={{ fontSize: "14px" }}>
                      Result: <span style={{ color: "#fff", fontWeight: "600" }}>{item.actual.result.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: "14px" }}>Score: {item.actual.score}</div>
                    <div style={{ fontSize: "12px" }} className="muted">Scorers: {item.actual.goalscorers.join(", ") || "None"}</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                    <span className="muted" style={{ fontSize: "12px" }}>Waiting for result...</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

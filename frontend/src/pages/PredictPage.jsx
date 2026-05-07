import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import MatchChat from "../components/MatchChat";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "../components/CustomSelect";

function PredictPage() {
  const auth = getAuth();
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [step, setStep] = useState(1);
  const [resultPick, setResultPick] = useState("home");
  const [homeGoals, setHomeGoals] = useState(1);
  const [awayGoals, setAwayGoals] = useState(0);
  const [goalscorersInput, setGoalscorersInput] = useState("");
  const [message, setMessage] = useState("");
  const [viewMessage, setViewMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [predLocked, setPredLocked] = useState(false);
  const [myPrediction, setMyPrediction] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    async function loadMatches() {
      try {
        const payload = await api.get("/api/matches/upcoming");
        setMatches(payload);
        if (payload.length > 0) setSelectedMatchId(payload[0].id);
      } catch (err) {
        setMessage(err.message);
      }
    }

    loadMatches();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const countdownText = useMemo(() => {
    if (!selectedMatch) return "--";
    const diffMs = new Date(selectedMatch.kickoff_at).getTime() - nowTs;
    if (diffMs <= 0) return "Kickoff started";
    const totalSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [selectedMatch, nowTs]);

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (step !== 3) return;
    handlePredictionSubmit();
  };

  async function handlePredictionSubmit() {
    if (busy || !auth || !selectedMatch) return;
    setBusy(true);
    setMessage("");
    try {
      const goalscorers = goalscorersInput.split(",").map(n => n.trim()).filter(Boolean);
      const payload = await api.post(`/api/matches/${selectedMatch.id}/prediction`, {
        user_id: auth.user_id,
        result_pick: resultPick,
        home_goals: Number(homeGoals),
        away_goals: Number(awayGoals),
        goalscorers
      });
      setMessage(payload.message);
      setPredLocked(true);
      setTimeout(() => {
        setResultPick("home");
        setHomeGoals(1);
        setAwayGoals(0);
        setGoalscorersInput("");
        setStep(1);
        setPredLocked(false);
      }, 3000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleViewMyPrediction() {
    if (!auth || !selectedMatch) return;
    setViewMessage("");
    try {
      const payload = await api.get(`/api/matches/${selectedMatch.id}/prediction/me?user_id=${auth.user_id}`);
      setMyPrediction(payload);
    } catch (err) {
      setMyPrediction(null);
      setViewMessage(err.message);
    }
  }

  return (
    <section className="section">
      <div className="section-eyebrow">Predict • Score • Climb</div>
      <h1 className="section-title">MATCH CENTRE</h1>

      {!auth && (
        <div className="empty-state">
          Log in to lock one prediction per match before kickoff. <Link to="/login">Go to login</Link>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="empty-state">No upcoming matches. Check back later!</div>
      ) : (
        <div className={selectedMatch ? "predict-grid" : "stack"}>
          <div className="stack">
            <article className="card" style={{ position: 'relative', zIndex: 10 }}>
              <label className="form-label" htmlFor="match-picker">Select Match</label>
              <CustomSelect
                id="match-picker"
                value={selectedMatchId ?? ""}
                placeholder="Select a match…"
                options={matches.map((m) => ({ value: m.id, label: `${m.home_team} vs ${m.away_team}` }))}
                onChange={(e) => {
                  setSelectedMatchId(Number(e.target.value));
                  setMyPrediction(null);
                  setViewMessage("");
                  setStep(1);
                }}
              />
              {selectedMatch && (
                <div style={{ marginTop: "12px" }}>
                  <p className="muted" style={{ fontSize: "14px", margin: "4px 0" }}>{selectedMatch.competition} • {selectedMatch.venue}</p>
                  <p className="muted" style={{ fontSize: "14px", margin: "4px 0" }}>Kickoff: {new Date(selectedMatch.kickoff_at).toLocaleString()}</p>
                  <p className="countdown" style={{ color: "var(--primary)", fontWeight: "bold" }}>Lock closes in: {countdownText}</p>
                </div>
              )}
            </article>

            <div className="flip-container">
              <div className={`flip-inner ${predLocked ? "flipped" : ""}`}>
                <div className="flip-front card">
                  <div className="wizard-steps" style={{ display: 'flex', position: 'relative', overflow: 'hidden', marginBottom: "20px" }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(step / 3) * 100}%`, background: 'rgba(82, 255, 26, 0.2)', transition: 'width 0.3s ease', borderRadius: '999px' }} />
                    <span className={`wizard-step ${step >= 1 ? "active" : ""}`} style={{ zIndex: 1, flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => setStep(1)}> Result</span>
                    <span className={`wizard-step ${step >= 2 ? "active" : ""}`} style={{ zIndex: 1, flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => setStep(2)}> Scoreline</span>
                    <span className={`wizard-step ${step >= 3 ? "active" : ""}`} style={{ zIndex: 1, flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => setStep(3)}> Scorers</span>
                  </div>

                  <form onSubmit={handleFormSubmit} style={{ overflow: 'hidden', position: 'relative', minHeight: '180px' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {step === 1 && (
                          <>
                            <label className="form-label">Pick Result</label>
                            <CustomSelect
                              value={resultPick}
                              options={[
                                { value: "home", label: "Home Win" },
                                { value: "draw", label: "Draw" },
                                { value: "away", label: "Away Win" },
                              ]}
                              onChange={(e) => setResultPick(e.target.value)}
                            />
                          </>
                        )}
                        {step === 2 && (
                          <div className="score-grid">
                            <div>
                              <label className="form-label">Home Goals</label>
                              <input className="form-input" type="number" min={0} value={homeGoals} onChange={(e) => setHomeGoals(e.target.value)} />
                            </div>
                            <div>
                              <label className="form-label">Away Goals</label>
                              <input className="form-input" type="number" min={0} value={awayGoals} onChange={(e) => setAwayGoals(e.target.value)} />
                            </div>
                          </div>
                        )}
                        {step === 3 && (
                          <>
                            <label className="form-label">Goalscorers (comma separated)</label>
                            <input className="form-input" value={goalscorersInput} onChange={(e) => setGoalscorersInput(e.target.value)} placeholder="Salah, Saka" />
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="nav-actions" style={{ marginTop: '24px', display: "flex", gap: "10px" }}>
                      <button className="btn" type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>Back</button>
                      {step < 3 ? (
                        <button className="btn btn-primary" type="button" onClick={() => setStep(s => Math.min(3, s + 1))}>Next Step</button>
                      ) : (
                        <button className="btn btn-primary" type="button" disabled={!auth || busy} onClick={handlePredictionSubmit}>
                          {busy ? "Locking..." : "Lock Prediction"}
                        </button>
                      )}
                    </div>
                  </form>
                  {message && !predLocked && <p style={{ marginTop: '12px', color: 'var(--accent)', fontSize: "14px" }}>{message}</p>}
                </div>

                <div className="flip-back card" style={{ background: 'rgba(17, 19, 28, 0.95)', border: '1px solid var(--primary)', textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>LOCKED</div>
                  <h3 style={{ color: "#fff" }}>Prediction Locked!</h3>
                  <p className="muted">Your pick has been saved. Good luck!</p>
                </div>
              </div>
            </div>

            <article className="card" style={{ marginTop: "20px" }}>
              <h3>My Prediction</h3>
              <p className="muted">Locked picks are visible here after submission.</p>
              <button className="btn" onClick={handleViewMyPrediction} disabled={!auth || !selectedMatch}>View Locked Pick</button>
              {myPrediction && (
                <div className="card" style={{ marginTop: "15px", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ fontSize: "14px" }}>Result: <span style={{ color: "var(--primary)", fontWeight: "bold" }}>{myPrediction.result_pick.toUpperCase()}</span></div>
                  <div style={{ fontSize: "14px" }}>Score: {myPrediction.home_goals} - {myPrediction.away_goals}</div>
                  <div style={{ fontSize: "12px" }} className="muted">Scorers: {Array.isArray(myPrediction.goalscorers) ? myPrediction.goalscorers.join(", ") : myPrediction.goalscorers}</div>
                </div>
              )}
              {viewMessage && <p className="muted" style={{ marginTop: "10px" }}>{viewMessage}</p>}
            </article>
          </div>

          {selectedMatch && (
            <aside className="stack">
              <MatchChat matchId={selectedMatch.id} />
              <p className="muted" style={{ fontSize: "11px", textAlign: "center", padding: "0 10px" }}>
                Keep it respectful. Chaos is allowed, but toxicity is banned.
              </p>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}

export default PredictPage;

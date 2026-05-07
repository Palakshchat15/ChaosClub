import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";

function useLocalState(key, defaultValue) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(val));
  }, [key, val]);

  return [val, setVal];
}

// ──────────────────────────────────────────────────────────────────
// 1. Riddle Widget
function RiddleWidget({ data, scope }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Array.isArray(data) ? data : (data ? [data] : []);
  const currentItem = items[currentIndex];
  
  const [revealed, setRevealed] = useLocalState(`fz_riddle_${scope}_0`, false);

  // Reset revealed state whenever we move to a new item
  useEffect(() => {
    const key = `fz_riddle_${scope}_${currentIndex}`;
    try {
      const stored = localStorage.getItem(key);
      setRevealed(stored ? JSON.parse(stored) : false);
    } catch {
      setRevealed(false);
    }
  }, [currentIndex, scope]);

  if (!currentItem || !currentItem.hints) return null;

  return (
    <div className="fz-widget fz-riddle">
      <div className="fz-header">
        <span>WHO AM I?</span> {items.length > 1 && <span className="muted">{currentIndex + 1}/{items.length}</span>}
      </div>
      {!revealed ? (
        <div className="fz-content">
          <ul style={{ paddingLeft: "20px", marginBottom: "16px", fontSize: "14px" }}>
            {currentItem.hints.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setRevealed(true)}>
            Reveal Answer
          </button>
        </div>
      ) : (
        <motion.div className="fz-content fz-reveal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {currentItem.image_url && <img src={currentItem.image_url} alt="Player" className="fz-img" />}
          <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center", color: "var(--accent)" }}>
            {currentItem.answer}
          </div>
          {currentIndex < items.length - 1 && (
            <button className="btn" style={{ width: "100%", marginTop: "16px", background: "var(--accent)", color: "#141925", fontWeight: "bold", border: "none" }} onClick={() => setCurrentIndex(i => i + 1)}>
              Next Riddle →
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 2. Transfer Rumor Mill
function RumorWidget({ data, scope }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Array.isArray(data) ? data : (data ? [data] : []);
  const currentItem = items[currentIndex];

  const [voted, setVoted] = useLocalState(`fz_rumor_${scope}_0`, null);
  const [votes, setVotes] = useState(currentItem?.votes || { hot: 0, not: 0 });

  // Reset voted and votes state whenever we move to a new item
  useEffect(() => {
    const key = `fz_rumor_${scope}_${currentIndex}`;
    try {
      const stored = localStorage.getItem(key);
      setVoted(stored ? JSON.parse(stored) : null);
    } catch {
      setVoted(null);
    }
    setVotes(currentItem?.votes || { hot: 0, not: 0 });
  }, [currentIndex, scope]);

  if (!currentItem || !currentItem.text) return null;

  const total = (votes.hot || 0) + (votes.not || 0);
  const hotPct = total > 0 ? Math.round(((votes.hot || 0) / total) * 100) : 50;

  async function handleVote(choice) {
    if (voted) return;
    setVoted(choice);
    setVotes(v => ({ ...v, [choice]: (v[choice] || 0) + 1 }));
    try { await api.post(`/api/funzone/vote/rumor?vote=${choice}&index=${currentIndex}`); } catch (e) {}
  }

  return (
    <div className="fz-widget fz-rumor">
      <div className="fz-header">
        <span>RUMOR MILL</span> {items.length > 1 && <span className="muted">{currentIndex + 1}/{items.length}</span>}
      </div>
      <div className="fz-content">
        <p style={{ fontWeight: 600, marginBottom: "12px", minHeight: "48px" }}>{currentItem.text}</p>
        {!voted ? (
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="fz-vote-btn hot" onClick={() => handleVote("hot")}>Hot</button>
            <button className="fz-vote-btn not" onClick={() => handleVote("not")}>Not</button>
          </div>
        ) : (
          <div className="fz-results">
            <div className="fz-bar-wrap">
              <div className="fz-bar hot-bar" style={{ width: `${hotPct}%` }} />
              <div className="fz-bar not-bar" style={{ width: `${100 - hotPct}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px" }}>
              <span style={{ color: "#ff6b6b" }}>{hotPct}% Hot</span>
              <span style={{ color: "#00d4ff" }}>{100 - hotPct}% Not</span>
            </div>
            {currentIndex < items.length - 1 && (
              <button className="btn" style={{ width: "100%", marginTop: "16px", background: "var(--accent)", color: "#141925", fontWeight: "bold", border: "none" }} onClick={() => setCurrentIndex(i => i + 1)}>
                Next Rumor →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 3. Emoji Charades
function CharadesWidget({ data, scope }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Array.isArray(data) ? data : (data ? [data] : []);
  const currentItem = items[currentIndex];
  
  const [revealed, setRevealed] = useLocalState(`fz_charades_${scope}_0`, false);

  // Reset revealed state whenever we move to a new item
  useEffect(() => {
    const key = `fz_charades_${scope}_${currentIndex}`;
    try {
      const stored = localStorage.getItem(key);
      setRevealed(stored ? JSON.parse(stored) : false);
    } catch {
      setRevealed(false);
    }
  }, [currentIndex, scope]);

  if (!currentItem || !currentItem.emojis) return null;

  return (
    <div className="fz-widget fz-charades">
      <div className="fz-header">
        <span>🕵️ CHARADES</span> {items.length > 1 && <span className="muted">{currentIndex + 1}/{items.length}</span>}
      </div>
      <div className="fz-content" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "36px", letterSpacing: "4px", marginBottom: "12px" }}>{currentItem.emojis}</div>
        {!revealed ? (
          <button className="btn" style={{ width: "100%" }} onClick={() => setRevealed(true)}>Guess & Reveal</button>
        ) : (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "#ffe440" }}>
              {currentItem.answer}
            </div>
            {currentIndex < items.length - 1 && (
              <button className="btn" style={{ width: "100%", marginTop: "16px", background: "var(--accent)", color: "#141925", fontWeight: "bold", border: "none" }} onClick={() => setCurrentIndex(i => i + 1)}>
                Next Charade →
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 5. On This Day
function OnThisDayWidget({ data }) {
  if (!data || !data.fact) return null;

  return (
    <div className="fz-widget fz-otd">
      <div className="fz-header">ON THIS DAY</div>
      <div className="fz-content" style={{ fontStyle: "italic", color: "#c3c8d8", fontSize: "14px", borderLeft: "3px solid var(--accent)", paddingLeft: "12px" }}>
        "{data.fact}"
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 6. Bold Prediction
function PredictionWidget({ data, scope }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = Array.isArray(data) ? data : (data ? [data] : []);
  const currentItem = items[currentIndex];

  const [voted, setVoted] = useLocalState(`fz_pred_${scope}_0`, null);
  const [votes, setVotes] = useState(currentItem?.votes || { yes: 0, no: 0 });

  // Reset voted and votes state whenever we move to a new item
  useEffect(() => {
    const key = `fz_pred_${scope}_${currentIndex}`;
    try {
      const stored = localStorage.getItem(key);
      setVoted(stored ? JSON.parse(stored) : null);
    } catch {
      setVoted(null);
    }
    setVotes(currentItem?.votes || { yes: 0, no: 0 });
  }, [currentIndex, scope]);

  if (!currentItem || !currentItem.question) return null;

  const total = (votes.yes || 0) + (votes.no || 0);
  const yesPct = total > 0 ? Math.round(((votes.yes || 0) / total) * 100) : 50;

  async function handleVote(choice) {
    if (voted) return;
    setVoted(choice);
    setVotes(v => ({ ...v, [choice]: (v[choice] || 0) + 1 }));
    try { await api.post(`/api/funzone/vote/prediction?vote=${choice}&index=${currentIndex}`); } catch (e) {}
  }

  return (
    <div className="fz-widget fz-prediction">
      <div className="fz-header">
        <span>PREDICTION</span> {items.length > 1 && <span className="muted">{currentIndex + 1}/{items.length}</span>}
      </div>
      <div className="fz-content">
        <p style={{ fontWeight: 600, marginBottom: "12px", minHeight: "48px" }}>{currentItem.question}</p>
        {!voted ? (
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="fz-vote-btn" style={{ background: "rgba(82, 255, 26, 0.1)", borderColor: "var(--accent)", color: "var(--accent)" }} onClick={() => handleVote("yes")}>Yes</button>
            <button className="fz-vote-btn" style={{ background: "rgba(255, 107, 107, 0.1)", borderColor: "#ff6b6b", color: "#ff6b6b" }} onClick={() => handleVote("no")}>No</button>
          </div>
        ) : (
          <div className="fz-results">
            <div style={{ fontSize: "14px", marginBottom: "6px" }}>Community says:</div>
            <div className="fz-progress">
              <div className="fz-progress-fill" style={{ width: `${yesPct}%`, background: "var(--accent)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "4px" }}>
              <span style={{ color: "var(--accent)" }}>{yesPct}% Yes</span>
              <span style={{ color: "#ff6b6b" }}>{100 - yesPct}% No</span>
            </div>
            {currentIndex < items.length - 1 && (
              <button className="btn" style={{ width: "100%", marginTop: "16px", background: "var(--accent)", color: "#141925", fontWeight: "bold", border: "none" }} onClick={() => setCurrentIndex(i => i + 1)}>
                Next Prediction →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Main Page Component
function parseJsonSafe(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

export default function FunZonePage() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api.get("/api/funzone/current")
      .then(res => setConfig(res))
      .catch(() => {});
  }, []);

  if (!config) return (
    <section className="section" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loader" />
    </section>
  );

  const data = {
    riddle: parseJsonSafe(config.riddle),
    rumor: parseJsonSafe(config.rumor),
    charades: parseJsonSafe(config.charades),
    var_room: parseJsonSafe(config.var_room),
    on_this_day: parseJsonSafe(config.on_this_day),
    prediction: parseJsonSafe(config.prediction),
    tic_tac_toe: parseJsonSafe(config.tic_tac_toe)
  };

  const scope = config.updated_at ? new Date(config.updated_at).getTime().toString() : "default";

  return (
    <section className="section">
      <div className="section-eyebrow" style={{ color: "#ff6b6b", textShadow: "0 0 10px rgba(255,107,107,0.4)" }}>
        Daily Engagement
      </div>
      <h1 className="section-title">THE FUN ZONE</h1>
      <p className="muted" style={{ marginBottom: "32px", fontSize: "15px", maxWidth: "600px" }}>
        Welcome to the daily Fun Zone! Put your football knowledge to the test, guess the daily charades, and vote on the latest rumors.
      </p>
      
      <div className="fz-page-grid">
        <div className="fz-span-2">
          <RiddleWidget data={data.riddle} scope={scope} />
        </div>
        <PredictionWidget data={data.prediction} scope={scope} />
        <CharadesWidget data={data.charades} scope={scope} />
        <div className="fz-span-2">
          <RumorWidget data={data.rumor} scope={scope} />
        </div>
        <OnThisDayWidget data={data.on_this_day} />
      </div>
    </section>
  );
}

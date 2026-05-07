import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";

function DailyFactPopup() {
  const [fact, setFact] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function loadFact() {
      try {
        const auth = getAuth();
        const userId = auth?.user_id ?? "guest";
        const payload = await api.get("/api/facts/today");
        const seenKey = `chaosclub-fact-seen-${userId}-${payload.date}`;
        if (!localStorage.getItem(seenKey)) {
          setFact(payload.fact);
          setVisible(true);
          localStorage.setItem(seenKey, "yes");
        }
      } catch {
        // Silent fail keeps UX clean
      }
    }

    loadFact();
  }, []);

  return (
    <AnimatePresence>
      {visible && fact && (
        <motion.div 
          className="fact-overlay" 
          role="dialog" 
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="fact-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <h3 style={{ marginTop: 0, fontSize: "28px" }}>Kickoff Curiosity</h3>
            <p style={{ lineHeight: 1.7, fontSize: "18px", color: "var(--muted)" }}>{fact}</p>
            <button className="btn btn-primary" onClick={() => setVisible(false)} style={{ marginTop: "12px" }}>
              Enter Chaos Club
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DailyFactPopup;

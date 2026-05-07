import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { motion } from "framer-motion";
import { gsap, ScrollTrigger } from "../lib/animations";

function LeaderboardPage() {
  const [scope, setScope] = useState("monthly");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const headingRef = useRef(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const payload = await api.get(`/api/leaderboard?scope=${scope}`);
        setRows(payload);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [scope]);

  // Heading entrance animation
  useEffect(() => {
    if (headingRef.current) {
      gsap.fromTo(headingRef.current,
        { opacity: 0, y: 40, skewY: 2 },
        { opacity: 1, y: 0, skewY: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  // Count-up for points after rows load
  useEffect(() => {
    if (!loading && rows.length > 0) {
      document.querySelectorAll(".pts-count").forEach((el) => {
        const endVal = Number(el.dataset.pts);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: endVal, duration: 1.4, ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.val) + " pts"; },
          scrollTrigger: { trigger: el, start: "top 95%", toggleActions: "play none none none" }
        });
      });
    }
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, [loading, rows]);

  return (
    <section className="section">
      <div className="section-eyebrow">Rewards Drop End of Month</div>
      <h1 ref={headingRef} className="section-title" style={{ opacity: 0 }}>LEADERBOARD</h1>
      <div className="nav-actions" style={{ marginBottom: "14px" }}>
        <button className={`btn ${scope === "monthly" ? "btn-primary" : ""}`} onClick={() => setScope("monthly")}>
          Monthly
        </button>
        <button className={`btn ${scope === "all_time" ? "btn-primary" : ""}`} onClick={() => setScope("all_time")}>
          All-Time
        </button>
      </div>
      {loading ? <div className="empty-state">Loading leaderboard...</div> : null}
      {error ? <div className="empty-state">{error}</div> : null}
      {!loading && !error ? (
        <motion.div 
          className="stack"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {rows.map((row) => {
            const isTop3 = row.rank <= 3;
            const isFirst = row.rank === 1;
            
            return (
              <motion.div 
                key={row.rank} 
                className="card"
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: isFirst ? '24px' : '16px',
                  border: isTop3 ? '1px solid rgba(82, 255, 26, 0.4)' : undefined,
                  boxShadow: isTop3 ? '0 0 15px rgba(82, 255, 26, 0.1)' : undefined,
                  background: isFirst ? 'rgba(82, 255, 26, 0.05)' : undefined
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontSize: isFirst ? '32px' : '24px', fontWeight: 900, color: isTop3 ? 'var(--accent)' : 'var(--muted)', width: '50px' }}>
                    {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`}
                  </div>
                  {/* Avatar */}
                  {row.avatar_url ? (
                    <div style={{ width: isFirst ? '48px' : '36px', height: isFirst ? '48px' : '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: isTop3 ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.1)' }}>
                      <img src={row.avatar_url} alt={row.fan} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: isFirst ? '48px' : '36px', height: isFirst ? '48px' : '36px',
                      borderRadius: '50%', flexShrink: 0,
                      background: isTop3 ? 'rgba(82,255,26,0.15)' : 'rgba(255,255,255,0.05)',
                      border: isTop3 ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.1)',
                      display: 'grid', placeItems: 'center',
                      fontWeight: 700, fontSize: isFirst ? '18px' : '14px',
                      color: isTop3 ? 'var(--accent)' : 'var(--muted)',
                    }}>
                      {row.fan.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ fontSize: isFirst ? '20px' : '16px', fontWeight: isTop3 ? 700 : 400, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {row.fan}
                  </div>
                </div>
                <div 
                  className="pts-count"
                  data-pts={row.points}
                  style={{ 
                    fontSize: isFirst ? '24px' : '18px', 
                    fontWeight: 900, 
                    color: isFirst ? 'var(--accent)' : '#ffe440' 
                  }}
                >
                  {row.points} pts
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : null}
    </section>
  );
}

export default LeaderboardPage;

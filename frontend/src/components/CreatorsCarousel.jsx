import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CREATORS = [
  {
    id: 1,
    image: "/creator1_new.jpg",
    name: "Divyansh Verma",
    role: "Divyansh",
    bio: "The driving force behind Chaos Club, conceptualizing the initial idea to blend football with chaotic predictions and real-time fan engagement.",
  },
  {
    id: 2,
    image: "/creator2_new.png",
    name: "Mohak Tripathi",
    role: "ONEMUFC",
    bio: "Architecting the robust FastAPI backend and seamless React frontend, turning the chaotic vision into a stable and scalable platform.",
  },
  {
    id: 3,
    image: "/creator3_new.png",
    name: "Muktesh Sharma",
    role: "Markaroni",
    bio: "Crafting the neon-infused, cyber-athletic visual identity that defines the entire Chaos Club experience — every pixel, every glow.",
  },
  {
    id: 4,
    image: "/creator4_v2.png",
    name: "Vinayak Sharma",
    role: "Chonkyy",
    bio: "Developing the predictive models and AI algorithms that power the Fun Zone, match analysis, and the smart leaderboard ranking system.",
  },
  {
    id: 5,
    image: "/creator5_new.png",
    name: "Yash Arora",
    role: "YjR",
    bio: "Engaging with the fans, curating the daily news feed, and keeping the spirit of football alive across every interaction on the platform.",
  },
];

export default function CreatorsCarousel() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = CREATORS.find((c) => c.id === selectedId);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 20px" }}>

      {/* ── 5 CREATOR CUTOUTS ── */}
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: "4px",
        padding: "20px 0 0",
      }}>
        {CREATORS.map((c) => {
          const isSelected = selectedId === c.id;
          const isDimmed = selectedId !== null && !isSelected;

          return (
            <motion.div
              key={c.id}
              onClick={() => setSelectedId(isSelected ? null : c.id)}
              animate={{
                scale: isSelected ? 1.12 : isDimmed ? 0.94 : 1,
                filter: isDimmed
                  ? "brightness(0.25) grayscale(60%)"
                  : "brightness(1) grayscale(0%)",
                zIndex: isSelected ? 10 : 1,
              }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              style={{
                cursor: "pointer",
                flex: "1 1 0",
                maxWidth: "220px",
                position: "relative",
                transformOrigin: "bottom center",
              }}
              whileHover={!isSelected && !isDimmed ? { scale: 1.05 } : {}}
            >
              <img
                src={c.image}
                alt={c.name}
                draggable={false}
                style={{
                  width: "100%",
                  display: "block",
                  userSelect: "none",
                }}
              />

              {/* Name badge — appears when selected */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(6,7,12,0.9)",
                      border: "1px solid var(--accent)",
                      borderRadius: "8px",
                      padding: "5px 12px",
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
                      {c.name}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "10px", fontFamily: "Inter, sans-serif" }}>
                      {c.role}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Hint when nobody selected */}
      <AnimatePresence>
        {!selectedId && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              textAlign: "center",
              color: "var(--muted)",
              fontSize: "13px",
              marginTop: "16px",
              animation: "pulse-hint 2.5s ease-in-out infinite",
            }}
          >
            Click on a creator to spotlight them
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── BIO CARD ── */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id}
            className="creator-bio-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2>{selected.name}</h2>
            <p className="creator-role">{selected.role}</p>
            <p>{selected.bio}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

export default function AuthCharacter({
  isPasswordActive,
  emailLength,
  isBusy,
  hasError,
  isSuccess,
  hasAvatar
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Eye movement mapping
  const eyeX = isPasswordActive ? 0 : (emailLength > 0 ? Math.min(emailLength * 0.4, 6) : 0);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => {
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 1500);
      }}
      animate={{
        scale: isHovered ? 1.1 : 1
      }}
      style={{
        width: "120px",
        height: "140px",
        margin: "0 auto 20px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer"
      }}
    >
      {/* The Face */}
      <motion.div
        animate={{
          y: isPasswordActive ? 15 : (isBusy ? [0, -10, 0] : (hasError ? 5 : 0)),
          rotate: hasError ? [0, -5, 5, -5, 5, 0] : (isClicked ? [0, -5, 5, -5, 5, 0] : 0)
        }}
        transition={{
          y: isBusy ? { repeat: Infinity, duration: 0.6 } : { duration: 0.2 },
          rotate: { duration: 0.4 }
        }}
        style={{
          width: "80px",
          height: "80px",
          background: "#1a1c26", // Darker Chaos Grey
          borderRadius: "50%",
          position: "relative",
          border: "4px solid var(--accent)" // Neon Green border
        }}
      >
        {/* Ears */}
        <div style={{ position: "absolute", width: "24px", height: "24px", background: "#1a1c26", borderRadius: "50%", left: "-10px", top: "20px", zIndex: -1, borderLeft: "2px solid var(--accent)" }} />
        <div style={{ position: "absolute", width: "24px", height: "24px", background: "#1a1c26", borderRadius: "50%", right: "-10px", top: "20px", zIndex: -1, borderRight: "2px solid var(--accent)" }} />

        {/* Muzzle / Mouth */}
        <motion.div
          animate={{
            scaleY: isSuccess || isClicked ? 1.2 : 1
          }}
          style={{
            position: "absolute",
            width: "50px",
            height: "35px",
            background: "#2d3142", // Slightly lighter grey
            borderRadius: "20px",
            bottom: "5px",
            left: "15px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* Mouth Line */}
          <motion.div
            animate={{
              width: isSuccess || isClicked ? 25 : (hasError ? 15 : 20),
              borderRadius: isSuccess || isClicked ? "0 0 15px 15px" : "10px",
              height: isSuccess || isClicked ? 10 : 2
            }}
            style={{ background: "var(--accent)", width: "20px", height: "2px", opacity: 0.8 }}
          />
        </motion.div>

        {/* Eyes Area */}
        <div style={{ position: "absolute", top: "20px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between" }}>
          {/* Eyes tracking or hidden */}
          <motion.div
            animate={{
              opacity: isPasswordActive ? 0 : 1,
              scaleY: isBusy ? [1, 0.1, 1] : (hasAvatar || isClicked ? 1.2 : 1)
            }}
            transition={{ scaleY: isBusy ? { repeat: Infinity, duration: 2, times: [0, 0.1, 0.2] } : {} }}
            style={{ width: "12px", height: "12px", background: "#000", borderRadius: "50%", border: "1px solid var(--accent)" }}
          >
            <motion.div
              animate={{ x: eyeX }}
              style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", margin: "2px" }}
            />
          </motion.div>

          <motion.div
            animate={{
              opacity: isPasswordActive ? 0 : 1,
              scaleY: isBusy ? [1, 0.1, 1] : (hasAvatar || isClicked ? 1.2 : 1)
            }}
            transition={{ scaleY: isBusy ? { repeat: Infinity, duration: 2, times: [0, 0.1, 0.2] } : {} }}
            style={{ width: "12px", height: "12px", background: "#000", borderRadius: "50%", border: "1px solid var(--accent)" }}
          >
            <motion.div
              animate={{ x: eyeX }}
              style={{ width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", margin: "2px" }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Hands */}
      {/* Left Hand */}
      <motion.div
        animate={{
          y: isPasswordActive ? -40 : (isSuccess ? 10 : (isBusy ? 30 : 45)),
          x: isPasswordActive ? -18 : (isSuccess ? -45 : -40),
          rotate: isPasswordActive ? 20 : (isSuccess ? -40 : 0)
        }}
        style={{
          position: "absolute",
          width: "35px",
          height: "35px",
          background: "#1a1c26",
          borderRadius: "50% 50% 10px 10px",
          border: "3px solid var(--accent)",
          zIndex: 10
        }}
      />
      {/* Right Hand (Waving) */}
      <motion.div
        animate={{
          y: isClicked ? [10, 0, 10, 0, 45] : (isPasswordActive ? -40 : (isSuccess ? 10 : (isBusy ? 30 : 45))),
          x: isClicked ? [45, 55, 45, 55, 40] : (isPasswordActive ? 18 : (isSuccess ? 45 : 40)),
          rotate: isClicked ? [-20, 20, -20, 20, 0] : (isPasswordActive ? -20 : (isSuccess ? 40 : 0))
        }}
        transition={{
          y: isClicked ? { duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] } : { duration: 0.2 },
          x: isClicked ? { duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] } : { duration: 0.2 },
          rotate: isClicked ? { duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] } : { duration: 0.2 }
        }}
        style={{
          position: "absolute",
          width: "35px",
          height: "35px",
          background: "#1a1c26",
          borderRadius: "50% 50% 10px 10px",
          border: "3px solid var(--accent)",
          zIndex: 10
        }}
      />

      {/* Success Celebration */}
      {isSuccess && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          style={{ position: "absolute", top: -20, fontSize: "24px" }}
        >
          Success!
        </motion.div>
      )}
    </motion.div>
  );
}

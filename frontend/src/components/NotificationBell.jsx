import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import { getAuth } from "../lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const auth = getAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!auth) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Polling every 10s for now
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const data = await api.get(`/api/notifications?user_id=${auth.user_id}`);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }

  async function markRead(id) {
    try {
      await api.post(`/api/notifications/${id}/read?user_id=${auth.user_id}`);
      // Remove from local state immediately so it "disappears"
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  }

  async function handleNotificationClick(n) {
    await markRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
    setOpen(false);
  }

  // Only show unread in the dropdown as per user request ("should not be seen after that")
  const activeNotifications = notifications.filter(n => !n.is_read);
  const unreadCount = activeNotifications.length;

  if (!auth) return null;

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ 
          background: "none", 
          border: "none", 
          color: "var(--fg)", 
          cursor: "pointer", 
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          borderRadius: "50%",
          transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ 
              position: "absolute", 
              top: "5px", 
              right: "5px", 
              background: "var(--primary)", 
              color: "#141925", 
              fontSize: "10px", 
              fontWeight: "800",
              minWidth: "16px",
              height: "16px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #141925"
            }}
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{ 
              position: "absolute", 
              top: "100%", 
              right: 0, 
              width: "300px", 
              background: "rgba(20, 25, 37, 0.98)", 
              border: "1px solid rgba(82, 255, 26, 0.2)", 
              borderRadius: "12px", 
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              marginTop: "10px",
              zIndex: 1000,
              overflow: "hidden",
              backdropFilter: "blur(12px)"
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--primary)" }}>Unread Notifications</span>
              {unreadCount > 0 && <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>{unreadCount}</span>}
            </div>

            <div style={{ maxHeight: "350px", overflowY: "auto" }}>
              {activeNotifications.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>🥂</div>
                  You're all caught up!
                </div>
              ) : (
                activeNotifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => handleNotificationClick(n)}
                    style={{ 
                      padding: "16px", 
                      borderBottom: "1px solid rgba(255,255,255,0.03)", 
                      cursor: "pointer",
                      background: "rgba(82, 255, 26, 0.02)",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(82, 255, 26, 0.05)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(82, 255, 26, 0.02)"}
                  >
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "var(--primary)", marginBottom: "4px" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", lineHeight: "1.4" }}>
                      {n.message}
                    </div>
                    <div className="muted" style={{ fontSize: "10px", marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                      <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ color: "var(--primary)", fontSize: "9px" }}>Click to view →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
